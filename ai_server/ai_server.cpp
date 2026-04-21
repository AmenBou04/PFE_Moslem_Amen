#include <iostream>
#include <string>
#include <vector>
#include <thread>
#include <chrono>
#include <cstdlib>
#include <opencv2/opencv.hpp>
#include "httplib.h"

using namespace std;
using namespace cv;
using namespace httplib;

static const string base64_chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789+/";

string base64Encode(const vector<unsigned char>& data) {
    string encoded;
    int val = 0;
    int valb = -6;

    for (unsigned char c : data) {
        val = (val << 8) + c;
        valb += 8;
        while (valb >= 0) {
            encoded.push_back(base64_chars[(val >> valb) & 0x3F]);
            valb -= 6;
        }
    }

    if (valb > -6) {
        encoded.push_back(base64_chars[((val << 8) >> (valb + 8)) & 0x3F]);
    }

    while (encoded.size() % 4) {
        encoded.push_back('=');
    }

    return encoded;
}

struct RuntimeConfig {
    string apiUrl = "http://localhost:8000";
    string apiKey = "";
    int cameraIndex = 0;
    string zoneId = "";
    string cameraDbId = "";
    bool headless = true;
    string snapshotPath = "latest_frame.jpg";
};

// Structure pour une zone
struct Zone {
    string nom;
    int x1, y1, x2, y2;
    string niveau;      // "PUBLIC", "RESTRICTED", "FORBIDDEN"
    string gravite;     // "FAIBLE", "MOYENNE", "CRITIQUE"
    Scalar couleur;
};

// Structure pour une détection
struct Detection {
    int x, y, w, h;
    float confidence;
};

class PcCameraIA {
private:
    VideoCapture cap;
    CascadeClassifier faceCascade;
    Client client;
    RuntimeConfig config;
    bool running;
    int frameCount;
    time_t lastAlertTime;
    int lastFaceCount;
    vector<Zone> zones;

    void saveSnapshot(const Mat& frame) {
        if (config.snapshotPath.empty()) {
            return;
        }

        vector<int> params = { IMWRITE_JPEG_QUALITY, 70 };
        imwrite(config.snapshotPath, frame, params);
    }

public:
    PcCameraIA(const RuntimeConfig& runtimeConfig)
        : client(runtimeConfig.apiUrl), config(runtimeConfig), running(true), frameCount(0), lastAlertTime(0), lastFaceCount(0) {
        // Ouvrir la webcam
        cap.open(config.cameraIndex);
        if (!cap.isOpened()) {
            cerr << "❌ Impossible d'ouvrir la webcam" << endl;
            exit(1);
        }
        
        // Optimisations
        cap.set(CAP_PROP_FRAME_WIDTH, 640);
        cap.set(CAP_PROP_FRAME_HEIGHT, 480);
        cap.set(CAP_PROP_FPS, 30);
        
        // Charger le modèle de détection
        string cascadePath = "haarcascade_frontalface_default.xml";
        if (!faceCascade.load(cascadePath)) {
            cerr << "❌ Impossible de charger le modèle" << endl;
            exit(1);
        }
        
        // ✅ DÉFINIR LES 3 ZONES
        // Zone 1 : Zone Publique (en haut)
        zones.push_back({
            "Zone Publique",
            0, 0, 640, 160,
            "PUBLIC",
            "FAIBLE",
            Scalar(0, 255, 0)  // Vert
        });
        
        // Zone 2 : Zone Restreinte (milieu)
        zones.push_back({
            "Zone Restreinte",
            0, 160, 640, 320,
            "RESTRICTED",
            "MOYENNE",
            Scalar(0, 255, 255)  // Jaune
        });
        
        // Zone 3 : Zone Interdite (en bas)
        zones.push_back({
            "Zone Interdite",
            0, 320, 640, 480,
            "FORBIDDEN",
            "CRITIQUE",
            Scalar(0, 0, 255)  // Rouge
        });
        
        cout << "✅ Service IA PC démarré" << endl;
        cout << "📷 Webcam ouverte - Résolution: 640x480" << endl;
        cout << "🗺️ Zones configurées:" << endl;
        for (const auto& zone : zones) {
            cout << "   - " << zone.nom << " (" << zone.gravite << ")" << endl;
        }
    }
    
    ~PcCameraIA() {
        cap.release();
    }
    
    // Détecter les visages
    vector<Rect> detectFaces(const Mat& frame) {
        Mat gray;
        cvtColor(frame, gray, COLOR_BGR2GRAY);
        vector<Rect> faces;
        faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, Size(60, 60));
        return faces;
    }
    
    // Déterminer la zone d'une personne
    string getZoneForPerson(int centerX, int centerY) {
        for (const auto& zone : zones) {
            if (centerX >= zone.x1 && centerX <= zone.x2 &&
                centerY >= zone.y1 && centerY <= zone.y2) {
                return zone.niveau;
            }
        }
        return "UNKNOWN";
    }
    
    string getGraviteForZone(const string& zone) {
        for (const auto& z : zones) {
            if (z.niveau == zone) {
                return z.gravite;
            }
        }
        return "MOYENNE";
    }
    
    // Dessiner les zones sur l'image
    void drawZones(Mat& frame) {
        for (const auto& zone : zones) {
            rectangle(frame, Point(zone.x1, zone.y1), Point(zone.x2, zone.y2), zone.couleur, 2);
            
            // Ajouter le texte de la zone
            putText(frame, zone.nom, Point(zone.x1 + 10, zone.y1 + 25),
                   FONT_HERSHEY_SIMPLEX, 0.6, zone.couleur, 2);
        }
    }
    
    // Envoyer alerte au backend
    void sendAlert(const string& type, const string& gravite, const string& description, const Mat& frame) {
        time_t now = time(nullptr);
        
        cout << "🔍 sendAlert appelée" << endl;
        cout << "   Type: " << type << endl;
        cout << "   Gravite: " << gravite << endl;
        
        if (now - lastAlertTime < 5) {
            cout << "   ⏰ Anti-spam: attente encore " << (5 - (now - lastAlertTime)) << "s" << endl;
            return;
        }
        lastAlertTime = now;

        vector<unsigned char> buffer;
        vector<int> encodeParams = { IMWRITE_JPEG_QUALITY, 75 };
        imencode(".jpg", frame, buffer, encodeParams);
        string imageBase64 = base64Encode(buffer);
        
        string json = "{";
        json += "\"type\":\"" + type + "\",";
        json += "\"gravite\":\"" + gravite + "\",";
        if (!config.zoneId.empty()) {
            json += "\"zone_id\":\"" + config.zoneId + "\",";
        }
        if (!config.cameraDbId.empty()) {
            json += "\"camera_id\":\"" + config.cameraDbId + "\",";
        }
        json += "\"description\":\"" + description + "\",";
        json += "\"image_capture\":\"data:image/jpeg;base64," + imageBase64 + "\"";
        json += "}";
        
        cout << "📤 Envoi à " << config.apiUrl << "/api/alertes/ai" << endl;
        cout << "📤 JSON: " << json << endl;
        
        try {
            Headers headers;
            if (!config.apiKey.empty()) {
                headers.emplace("x-ai-key", config.apiKey);
            }

            auto res = client.Post("/api/alertes/ai", headers, json, "application/json");
            
            if (res) {
                cout << "✅ Réponse reçue - Status: " << res->status << endl;
                if (res->status == 201) {
                    cout << "✅ Alerte envoyée avec succès!" << endl;
                } else {
                    cout << "❌ Erreur HTTP: " << res->status << endl;
                    cout << "   Réponse: " << res->body << endl;
                }
            } else {
                cout << "❌ Pas de réponse du serveur!" << endl;
                cout << "   Vérifie que le backend tourne sur " << config.apiUrl << endl;
            }
        } catch (const exception& e) {
            cout << "❌ Exception: " << e.what() << endl;
        }
    }
    
    void run() {
        cout << "🔍 Surveillance PC démarrée..." << endl;
        cout << "💡 Appuie sur ESC pour quitter" << endl;
        cout << endl;
        cout << "📋 Légende des zones:" << endl;
        cout << "   🟢 Zone Publique (Vert) → Alerte FAIBLE" << endl;
        cout << "   🟡 Zone Restreinte (Jaune) → Alerte MOYENNE" << endl;
        cout << "   🔴 Zone Interdite (Rouge) → Alerte CRITIQUE" << endl;
        cout << endl;
        
        Mat frame;
        
        while (running) {
            cap >> frame;
            if (frame.empty()) {
                cout << "⚠️ Frame vide, tentative de reconnexion..." << endl;
                this_thread::sleep_for(chrono::milliseconds(500));
                continue;
            }
            
            frameCount++;
            
            // Détection des visages (1 frame sur 2)
            if (frameCount % 2 == 0) {
                auto faces = detectFaces(frame);
                int faceCount = faces.size();
                
                // Dessiner les rectangles des visages
                for (const auto& face : faces) {
                    rectangle(frame, Point(face.x, face.y), 
                             Point(face.x + face.width, face.y + face.height), 
                             Scalar(255, 255, 255), 2);
                }
                
                // Analyser chaque visage
                if (faceCount > 0) {
                    for (const auto& face : faces) {
                        int centerX = face.x + face.width / 2;
                        int centerY = face.y + face.height / 2;
                        
                        string zone = getZoneForPerson(centerX, centerY);
                        string gravite = getGraviteForZone(zone);
                        
                        string description = to_string(faceCount) + " personne(s) dans " + zone;
                        
                        // Afficher la zone sur l'image
                        Scalar textColor;
                        if (zone == "PUBLIC") textColor = Scalar(0, 255, 0);
                        else if (zone == "RESTRICTED") textColor = Scalar(0, 255, 255);
                        else textColor = Scalar(0, 0, 255);
                        
                        putText(frame, "Zone: " + zone, Point(face.x, face.y - 10),
                               FONT_HERSHEY_SIMPLEX, 0.5, textColor, 1);
                        
                        // Envoyer l'alerte
                        if (zone == "FORBIDDEN") {
                            sendAlert("INTRUSION", "CRITIQUE", "Personne en zone interdite - " + description, frame);
                        } else if (zone == "RESTRICTED") {
                            sendAlert("ANOMALIE", "MOYENNE", "Personne en zone restreinte - " + description, frame);
                        } else if (zone == "PUBLIC") {
                            // Optionnel: ne pas envoyer d'alerte pour la zone publique
                            // sendAlert("PRESENCE", "FAIBLE", description);
                            cout << "ℹ️ Personne en zone publique - Pas d'alerte" << endl;
                        }
                    }
                    
                    lastFaceCount = faceCount;
                }
            }
            
            // Dessiner les zones
            drawZones(frame);

            if (frameCount % 3 == 0) {
                saveSnapshot(frame);
            }
            
            // Afficher les informations
            putText(frame, "Surveillance PC - 3 Zones", Point(10, 30), 
                   FONT_HERSHEY_SIMPLEX, 0.7, Scalar(255, 255, 255), 2);
            putText(frame, "Visages: " + to_string(lastFaceCount), Point(10, 60), 
                   FONT_HERSHEY_SIMPLEX, 0.5, Scalar(255, 255, 255), 1);
            
            if (!config.headless) {
                imshow("PFE - Surveillance PC (3 Zones)", frame);
                if (waitKey(30) == 27) {
                    running = false;
                }
            } else {
                this_thread::sleep_for(chrono::milliseconds(30));
            }
        }
        
        if (!config.headless) {
            destroyAllWindows();
        }
    }
};

RuntimeConfig parseRuntimeConfig(int argc, char* argv[]) {
    RuntimeConfig config;

    for (int i = 1; i < argc; ++i) {
        string arg = argv[i];

        if (arg == "--camera-index" && i + 1 < argc) {
            config.cameraIndex = atoi(argv[++i]);
        } else if (arg == "--camera-id-db" && i + 1 < argc) {
            config.cameraDbId = argv[++i];
        } else if (arg == "--zone-id" && i + 1 < argc) {
            config.zoneId = argv[++i];
        } else if (arg == "--api-url" && i + 1 < argc) {
            config.apiUrl = argv[++i];
        } else if (arg == "--api-key" && i + 1 < argc) {
            config.apiKey = argv[++i];
        } else if (arg == "--show-window") {
            config.headless = false;
        } else if (arg == "--headless") {
            config.headless = true;
        } else if (arg == "--snapshot-path" && i + 1 < argc) {
            config.snapshotPath = argv[++i];
        }
    }

    return config;
}

int main(int argc, char* argv[]) {
    cout << "======================================" << endl;
    cout << "🧠 SERVICE IA - SURVEILLANCE PC (3 ZONES)" << endl;
    cout << "======================================" << endl;

    RuntimeConfig runtimeConfig = parseRuntimeConfig(argc, argv);
    cout << "Camera index: " << runtimeConfig.cameraIndex << endl;
    cout << "Headless: " << (runtimeConfig.headless ? "true" : "false") << endl;
    
    PcCameraIA service(runtimeConfig);
    service.run();
    
    return 0;
}

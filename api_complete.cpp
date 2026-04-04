#include <iostream>
#include <string>
#include <windows.h>
#include "httplib.h"

using namespace std;

// =====================================================
// SQLITE
// =====================================================

typedef int (*sqlite3_open_t)(const char*, void**);
typedef int (*sqlite3_exec_t)(void*, const char*, int (*callback)(void*,int,char**,char**), void*, char**);
typedef int (*sqlite3_close_t)(void*);
typedef const char* (*sqlite3_errmsg_t)(void*);
typedef void (*sqlite3_free_t)(void*);

sqlite3_open_t sqlite3_open;
sqlite3_exec_t sqlite3_exec;
sqlite3_close_t sqlite3_close;
sqlite3_errmsg_t sqlite3_errmsg;
sqlite3_free_t sqlite3_free;
HMODULE hSqlite;
void* db;

bool initSQLite() {
    hSqlite = LoadLibrary("lib/sqlite/sqlite3.dll");
    if (!hSqlite) return false;
    
    sqlite3_open = (sqlite3_open_t)GetProcAddress(hSqlite, "sqlite3_open");
    sqlite3_exec = (sqlite3_exec_t)GetProcAddress(hSqlite, "sqlite3_exec");
    sqlite3_close = (sqlite3_close_t)GetProcAddress(hSqlite, "sqlite3_close");
    sqlite3_errmsg = (sqlite3_errmsg_t)GetProcAddress(hSqlite, "sqlite3_errmsg");
    sqlite3_free = (sqlite3_free_t)GetProcAddress(hSqlite, "sqlite3_free");
    
    return true;
}

// =====================================================
// AUTHENTIFICATION
// =====================================================

bool verifierUtilisateur(const string& email, const string& password, int& user_id, string& role) {
    string sql = "SELECT id, role FROM utilisateurs WHERE email = '" + email + 
                 "' AND mot_de_passe_hash = '" + password + "' AND est_actif = 1";
    
    struct Result { int id; string role; } result = {0, ""};
    
    auto callback = [](void* data, int argc, char** argv, char** col) -> int {
        auto* r = (Result*)data;
        r->id = atoi(argv[0]);
        r->role = argv[1];
        return 0;
    };
    
    sqlite3_exec(db, sql.c_str(), callback, &result, 0);
    
    if (result.id > 0) {
        user_id = result.id;
        role = result.role;
        return true;
    }
    return false;
}

// =====================================================
// ALERTES
// =====================================================

string alertes_json;
int callbackAlertes(void* data, int argc, char** argv, char** colName) {
    if (alertes_json.length() > 2) alertes_json += ",";
    alertes_json += "{";
    for (int i = 0; i < argc; i++) {
        if (i > 0) alertes_json += ",";
        alertes_json += "\"" + string(colName[i]) + "\":\"" + (argv[i] ? argv[i] : "") + "\"";
    }
    alertes_json += "}";
    return 0;
}

string getAlertesJSON() {
    alertes_json = "[";
    sqlite3_exec(db, "SELECT id, type, gravite, description, statut, date_creation FROM alertes ORDER BY date_creation DESC LIMIT 50", callbackAlertes, 0, 0);
    alertes_json += "]";
    return alertes_json;
}

bool insererAlerte(const string& type, const string& gravite, const string& description) {
    string sql = "INSERT INTO alertes (type, gravite, description) VALUES ('" +
                 type + "', '" + gravite + "', '" + description + "')";
    char* errMsg = 0;
    int rc = sqlite3_exec(db, sql.c_str(), 0, 0, &errMsg);
    if (rc != 0) {
        cerr << "Erreur SQL: " << errMsg << endl;
        sqlite3_free(errMsg);
        return false;
    }
    return true;
}

// =====================================================
// MAIN
// =====================================================

int main() {
    cout << "======================================" << endl;
    cout << "🏭 PFE - API SERVEUR" << endl;
    cout << "======================================" << endl;
    
    if (!initSQLite()) {
        cerr << "❌ Impossible de charger SQLite" << endl;
        return 1;
    }
    
    int rc = sqlite3_open("database/sqlite/surveillance.db", &db);
    if (rc != 0) {
        cerr << "❌ Erreur ouverture base" << endl;
        return 1;
    }
    cout << "✅ Base SQLite connectée" << endl;
    
    httplib::Server svr;
    
    // CORS
    svr.Options("/.*", [](const httplib::Request&, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        res.status = 200;
    });
    
    // POST /api/auth/login
    svr.Post("/api/auth/login", [](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        
        string body = req.body;
        string email = "admin@isi.tn";
        string password = "admin123";
        
        size_t pos = body.find("\"email\"");
        if (pos != string::npos) {
            size_t debut = body.find(":", pos) + 2;
            size_t fin = body.find("\"", debut);
            if (debut < fin) email = body.substr(debut, fin - debut);
        }
        
        pos = body.find("\"password\"");
        if (pos != string::npos) {
            size_t debut = body.find(":", pos) + 2;
            size_t fin = body.find("\"", debut);
            if (debut < fin) password = body.substr(debut, fin - debut);
        }
        
        int user_id;
        string role;
        
        if (verifierUtilisateur(email, password, user_id, role)) {
            string token = "token_" + to_string(user_id);
            res.set_content("{\"status\":\"ok\",\"token\":\"" + token + "\",\"role\":\"" + role + "\",\"user_id\":" + to_string(user_id) + "}", "application/json");
        } else {
            res.status = 401;
            res.set_content("{\"status\":\"error\",\"message\":\"Email ou mot de passe incorrect\"}", "application/json");
        }
    });
    
    // GET /api/alertes
    svr.Get("/api/alertes", [](const httplib::Request&, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_content(getAlertesJSON(), "application/json");
    });
    
    // POST /api/alertes
    svr.Post("/api/alertes", [](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        
        string body = req.body;
        string type = "INTRUSION";
        string gravite = "CRITIQUE";
        string description = "Alerte test";
        
        size_t pos = body.find("\"type\"");
        if (pos != string::npos) {
            size_t debut = body.find(":", pos) + 2;
            size_t fin = body.find("\"", debut);
            if (debut < fin) type = body.substr(debut, fin - debut);
        }
        
        pos = body.find("\"gravite\"");
        if (pos != string::npos) {
            size_t debut = body.find(":", pos) + 2;
            size_t fin = body.find("\"", debut);
            if (debut < fin) gravite = body.substr(debut, fin - debut);
        }
        
        pos = body.find("\"description\"");
        if (pos != string::npos) {
            size_t debut = body.find(":", pos) + 2;
            size_t fin = body.find("\"", debut);
            if (debut < fin) description = body.substr(debut, fin - debut);
        }
        
        if (insererAlerte(type, gravite, description)) {
            res.set_content("{\"status\":\"ok\"}", "application/json");
        } else {
            res.status = 500;
            res.set_content("{\"error\":\"Database error\"}", "application/json");
        }
    });
    
    // GET /api/health
    svr.Get("/api/health", [](const httplib::Request&, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_content("{\"status\":\"healthy\",\"database\":\"sqlite\"}", "application/json");
    });
    
    cout << "🚀 API SQLite démarrée sur http://localhost:8000" << endl;
    cout << "📋 Endpoints:" << endl;
    cout << "   POST /api/auth/login" << endl;
    cout << "   GET  /api/alertes" << endl;
    cout << "   POST /api/alertes" << endl;
    cout << "   GET  /api/health" << endl;
    cout << endl;
    
    svr.listen("0.0.0.0", 8000);
    
    sqlite3_close(db);
    FreeLibrary(hSqlite);
    return 0;
}
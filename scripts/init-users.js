"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var better_sqlite3_1 = __importDefault(require("better-sqlite3"));
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var path_1 = __importDefault(require("path"));
var DB_PATH = path_1.default.join(process.cwd(), 'src', 'lib', 'database', 'wct.db');
function initializeUsers() {
    return __awaiter(this, void 0, void 0, function () {
        var db, adminPasswordHash, navneetPasswordHash, insertUser, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    console.log('🚀 Starting User Database Initialization');
                    db = new better_sqlite3_1.default(DB_PATH, { verbose: console.log });
                    // Create users table
                    db.exec("\n      CREATE TABLE IF NOT EXISTS users (\n        id INTEGER PRIMARY KEY AUTOINCREMENT,\n        username TEXT UNIQUE NOT NULL,\n        email TEXT UNIQUE NOT NULL,\n        password_hash TEXT NOT NULL,\n        role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),\n        is_active BOOLEAN DEFAULT 1,\n        last_login DATETIME,\n        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP\n      );\n\n      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);\n      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);\n    ");
                    return [4 /*yield*/, bcryptjs_1.default.hash('admin123', 10)];
                case 1:
                    adminPasswordHash = _a.sent();
                    return [4 /*yield*/, bcryptjs_1.default.hash('welcomenavneet', 10)];
                case 2:
                    navneetPasswordHash = _a.sent();
                    insertUser = db.prepare("\n      INSERT OR REPLACE INTO users (username, email, password_hash, role)\n      VALUES (?, ?, ?, ?)\n    ");
                    // Insert admin user
                    insertUser.run('admin', 'admin@nextias.com', adminPasswordHash, 'admin');
                    // Insert Navneet user
                    insertUser.run('navneet', 'navneet@nextias.com', navneetPasswordHash, 'user');
                    console.log('✅ Users created successfully');
                    db.close();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('❌ Failed to initialize users:', error_1);
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.default = initializeUsers;
initializeUsers().catch(console.error);

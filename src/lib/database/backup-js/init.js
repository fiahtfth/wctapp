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
exports.DB_PATH = void 0;
exports.createQuestionsTable = createQuestionsTable;
exports.createCartTables = createCartTables;
exports.createUsersTable = createUsersTable;
exports.initializeDatabase = initializeDatabase;
var better_sqlite3_1 = __importDefault(require("better-sqlite3"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var init_users_1 = __importDefault(require("../../../scripts/init-users"));
exports.DB_PATH = path_1.default.join(process.cwd(), 'src', 'lib', 'database', 'wct.db');
var SCHEMA_PATH = path_1.default.join(process.cwd(), 'src', 'lib', 'database', 'schema.sql');
function createQuestionsTable(db) {
    var database = null;
    try {
        // Use provided database or create a new connection
        database = db || new better_sqlite3_1.default(exports.DB_PATH);
        console.log('🔨 Creating or verifying questions table');
        // Comprehensive table creation with detailed logging
        var createTableSQL = "\n            CREATE TABLE IF NOT EXISTS questions (\n                id INTEGER PRIMARY KEY AUTOINCREMENT,\n                Question TEXT NOT NULL,\n                Answer TEXT NOT NULL,\n                Explanation TEXT,\n                Subject TEXT NOT NULL,\n                \"Module Name\" TEXT NOT NULL,\n                Topic TEXT NOT NULL,\n                \"Sub Topic\" TEXT,\n                \"Difficulty Level\" TEXT NOT NULL,\n                Question_Type TEXT NOT NULL,\n                CONSTRAINT unique_question UNIQUE(Question)\n            )\n        ";
        try {
            // Prepare and run table creation statement
            var stmt = database.prepare(createTableSQL);
            stmt.run();
            console.log('✅ Questions table created or already exists');
        }
        catch (tableCreationError) {
            console.error('❌ Error creating questions table:', tableCreationError);
            throw new Error("Failed to create questions table: ".concat(tableCreationError instanceof Error ? tableCreationError.message : String(tableCreationError)));
        }
        // Optional: Add indexes for performance
        var indexStatements = [
            "CREATE INDEX IF NOT EXISTS idx_subject ON questions(Subject)",
            "CREATE INDEX IF NOT EXISTS idx_module ON questions(\"Module Name\")",
            "CREATE INDEX IF NOT EXISTS idx_topic ON questions(Topic)",
            "CREATE INDEX IF NOT EXISTS idx_difficulty ON questions(\"Difficulty Level\")",
            "CREATE INDEX IF NOT EXISTS idx_question_type ON questions(Question_Type)"
        ];
        indexStatements.forEach(function (indexSQL) {
            try {
                if (database) {
                    database.prepare(indexSQL).run();
                    console.log("\u2728 Index created: ".concat(indexSQL));
                }
                else {
                    console.warn('Database connection is null');
                }
            }
            catch (indexError) {
                console.warn("\u26A0\uFE0F Could not create index: ".concat(indexSQL), indexError);
            }
        });
        // Verify table structure
        try {
            if (database) {
                var tableInfo = database.prepare("PRAGMA table_info(questions)").all();
                console.log('📋 Questions table structure:', tableInfo);
            }
            else {
                console.warn('Database connection is null');
            }
        }
        catch (infoError) {
            console.warn('❌ Could not retrieve table info:', infoError);
        }
    }
    catch (error) {
        console.error('❌ Comprehensive Questions Table Creation Error:', {
            message: error instanceof Error ? error.message : String(error),
            fullError: error
        });
        throw error;
    }
    finally {
        // Close the database if we created a new connection
        if (db === undefined && database) {
            try {
                database.close();
                console.log('🔒 Temporary database connection closed');
            }
            catch (closeError) {
                console.error('❌ Error closing database:', closeError);
            }
        }
    }
}
function createCartTables(db) {
    var database = null;
    try {
        // Use provided database or create a new connection
        database = db || new better_sqlite3_1.default(exports.DB_PATH);
        console.log('🔨 Creating or verifying cart tables');
        // Create carts table
        var createCartsTableSQL = "\n            CREATE TABLE IF NOT EXISTS carts (\n                id INTEGER PRIMARY KEY AUTOINCREMENT,\n                test_id TEXT NOT NULL,\n                user_id INTEGER NOT NULL,\n                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n                CONSTRAINT unique_test_id_user UNIQUE(test_id, user_id),\n                FOREIGN KEY (user_id) REFERENCES users(id)\n            )\n        ";
        // Create cart items table
        var createCartItemsTableSQL = "\n            CREATE TABLE IF NOT EXISTS cart_items (\n                id INTEGER PRIMARY KEY AUTOINCREMENT,\n                cart_id INTEGER NOT NULL,\n                question_id INTEGER NOT NULL,\n                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n                FOREIGN KEY (cart_id) REFERENCES carts(id),\n                FOREIGN KEY (question_id) REFERENCES questions(id),\n                CONSTRAINT unique_cart_question UNIQUE(cart_id, question_id)\n            )\n        ";
        try {
            // Create tables
            database.prepare(createCartsTableSQL).run();
            database.prepare(createCartItemsTableSQL).run();
            console.log('✅ Cart tables created or already exist');
        }
        catch (tableCreationError) {
            console.error('❌ Error creating cart tables:', tableCreationError);
            throw new Error("Failed to create cart tables: ".concat(tableCreationError instanceof Error ? tableCreationError.message : String(tableCreationError)));
        }
    }
    catch (error) {
        console.error('❌ Comprehensive Cart Tables Creation Error:', {
            message: error instanceof Error ? error.message : String(error),
            fullError: error
        });
        throw error;
    }
    finally {
        // Close the database if we created a new connection
        if (db === undefined && database) {
            try {
                database.close();
                console.log('🔒 Temporary database connection closed');
            }
            catch (closeError) {
                console.error('❌ Error closing database:', closeError);
            }
        }
    }
}
function createUsersTable(db) {
    var database = null;
    try {
        // Use provided database or create a new connection
        database = db || new better_sqlite3_1.default(exports.DB_PATH);
        console.log('🔨 Creating or verifying users table');
        // Create users table
        var createUsersTableSQL = "\n            CREATE TABLE IF NOT EXISTS users (\n                id INTEGER PRIMARY KEY AUTOINCREMENT,\n                username TEXT NOT NULL,\n                email TEXT NOT NULL,\n                password_hash TEXT NOT NULL,\n                role TEXT NOT NULL CHECK(role IN ('admin', 'user')),\n                is_active INTEGER NOT NULL DEFAULT 1,\n                last_login DATETIME,\n                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n                CONSTRAINT unique_email UNIQUE(email),\n                CONSTRAINT unique_username UNIQUE(username)\n            )\n        ";
        try {
            // Create table
            database.prepare(createUsersTableSQL).run();
            console.log('✅ Users table created or already exists');
            // Add admin user if not exists
            var adminUser = database.prepare('SELECT id FROM users WHERE email = ?').get('admin@nextias.com');
            if (!adminUser) {
                var saltRounds = 10;
                var passwordHash = bcryptjs_1.default.hashSync('admin123', saltRounds);
                database.prepare('INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)').run('admin', 'admin@nextias.com', passwordHash, 'admin');
                console.log('✅ Admin user created');
            }
        }
        catch (tableCreationError) {
            console.error('❌ Error creating users table:', tableCreationError);
            throw new Error("Failed to create users table: ".concat(tableCreationError instanceof Error ? tableCreationError.message : String(tableCreationError)));
        }
    }
    catch (error) {
        console.error('❌ Comprehensive Users Table Creation Error:', {
            message: error instanceof Error ? error.message : String(error),
            fullError: error
        });
        throw error;
    }
    finally {
        // Close the database if we created a new connection
        if (db === undefined && database) {
            try {
                database.close();
                console.log('🔒 Temporary database connection closed');
            }
            catch (closeError) {
                console.error('❌ Error closing database:', closeError);
            }
        }
    }
}
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        var dbDirectory, db, tableError_1, countResult, questionsCount, sampleQuestions, insertQuestionStmt_1, insertMany, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    console.log('🚀 Starting Database Initialization');
                    console.log('Database Path:', exports.DB_PATH);
                    console.log('Current Working Directory:', process.cwd());
                    dbDirectory = path_1.default.dirname(exports.DB_PATH);
                    if (!fs_1.default.existsSync(dbDirectory)) {
                        console.log('📂 Database directory does not exist, creating...');
                        try {
                            fs_1.default.mkdirSync(dbDirectory, { recursive: true });
                            console.log('📁 Database directory created successfully');
                        }
                        catch (dirError) {
                            console.error('❌ Failed to create database directory:', dirError);
                            throw new Error("Failed to create database directory: ".concat(dirError instanceof Error ? dirError.message : String(dirError)));
                        }
                    }
                    db = void 0;
                    try {
                        db = new better_sqlite3_1.default(exports.DB_PATH, {
                            verbose: console.log, // Log all database operations
                            fileMustExist: false
                        });
                        console.log('💾 Database file opened/created successfully');
                    }
                    catch (dbOpenError) {
                        console.error('❌ Failed to open/create database:', dbOpenError);
                        throw new Error("Failed to open database: ".concat(dbOpenError instanceof Error ? dbOpenError.message : String(dbOpenError)));
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    createUsersTable(db);
                    console.log('✅ Users table created or verified');
                    // Call initializeUsers to populate the users table
                    return [4 /*yield*/, (0, init_users_1.default)()];
                case 2:
                    // Call initializeUsers to populate the users table
                    _a.sent();
                    createQuestionsTable(db);
                    createCartTables(db);
                    console.log('✅ All tables created or verified');
                    return [3 /*break*/, 4];
                case 3:
                    tableError_1 = _a.sent();
                    console.error('❌ Failed to create tables:', tableError_1);
                    throw new Error("Failed to create tables: ".concat(tableError_1 instanceof Error ? tableError_1.message : String(tableError_1)));
                case 4:
                    // Insert initial data if needed
                    try {
                        countResult = db.prepare('SELECT COUNT(*) as count FROM questions').get();
                        questionsCount = countResult.count;
                        console.log("\uD83D\uDCCA Total questions in database: ".concat(questionsCount));
                        if (questionsCount === 0) {
                            console.warn('⚠️ No questions found. Consider adding initial data.');
                            sampleQuestions = [
                                {
                                    Question: 'What is the capital of France?',
                                    Answer: 'Paris',
                                    Explanation: 'Paris is the capital and largest city of France',
                                    Subject: 'Geography',
                                    'Module Name': 'European Capitals',
                                    Topic: 'France',
                                    'Question_Type': 'Objective',
                                    'Difficulty Level': 'Easy'
                                },
                                {
                                    Question: 'What is the derivative of x^2?',
                                    Answer: '2x',
                                    Explanation: 'The derivative of x^2 is 2x using the power rule of differentiation',
                                    Subject: 'Mathematics',
                                    'Module Name': 'Calculus',
                                    Topic: 'Differentiation',
                                    'Question_Type': 'Objective',
                                    'Difficulty Level': 'Medium'
                                }
                            ];
                            insertQuestionStmt_1 = db.prepare("\n                    INSERT INTO questions \n                    (Question, Answer, Explanation, Subject, \"Module Name\", Topic, \"Question_Type\", \"Difficulty Level\") \n                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)\n                ");
                            insertMany = db.transaction(function (questions) {
                                for (var _i = 0, questions_1 = questions; _i < questions_1.length; _i++) {
                                    var q = questions_1[_i];
                                    insertQuestionStmt_1.run(q.Question, q.Answer, q.Explanation, q.Subject, q['Module Name'], q.Topic, q['Question_Type'], q['Difficulty Level']);
                                }
                            });
                            insertMany(sampleQuestions);
                            console.log('✨ Sample questions added successfully');
                        }
                    }
                    catch (dataError) {
                        console.error('❌ Failed to handle initial data:', dataError);
                        throw new Error("Failed to handle initial data: ".concat(dataError instanceof Error ? dataError.message : String(dataError)));
                    }
                    // Close the database connection
                    try {
                        db.close();
                        console.log('🔒 Database connection closed');
                    }
                    catch (closeError) {
                        console.error('❌ Failed to close database connection:', closeError);
                    }
                    console.log('✅ Database initialization complete');
                    return [2 /*return*/, db];
                case 5:
                    error_1 = _a.sent();
                    console.error('❌ Database Initialization Failed:', error_1);
                    throw error_1;
                case 6: return [2 /*return*/];
            }
        });
    });
}

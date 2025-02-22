import pandas as pd
import sqlite3
import os
import sys

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EXCEL_PATH = os.path.join(BASE_DIR, 'wctquestionscombined.xlsx')
DB_PATH = os.path.join(BASE_DIR, 'questions.db')

def sanitize_difficulty_level(level):
    """
    Sanitize difficulty level to match schema constraints.
    Converts to lowercase and maps to 'easy', 'medium', or 'hard'.
    """
    if pd.isna(level):
        return None
    
    level_str = str(level).lower().strip()
    
    # Mapping variations to standard levels
    difficulty_map = {
        'easy': 'easy',
        'e': 'easy',
        'medium': 'medium',
        'm': 'medium',
        'avg': 'medium',
        'hard': 'hard',
        'h': 'hard',
        'difficult': 'hard'
    }
    
    return difficulty_map.get(level_str, None)

def import_questions():
    # Read Excel file
    try:
        df = pd.read_excel(EXCEL_PATH)
        
        # Sanitize difficulty levels
        df['Difficulty Level'] = df['Difficulty Level'].apply(sanitize_difficulty_level)
        
        print(f"Loaded {len(df)} questions from Excel file.")
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        sys.exit(1)

    # Connect to SQLite database
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

    # Prepare insert statement
    insert_query = '''
    INSERT INTO questions (
        Question, 
        Answer, 
        Explanation, 
        Subject, 
        "Module Number", 
        "Module Name", 
        Topic, 
        "Sub Topic", 
        "Micro Topic", 
        "Faculty Approved", 
        "Difficulty Level", 
        "Nature of Question", 
        Question_Type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    '''

    # Batch insert
    try:
        # Start a transaction
        conn.execute('BEGIN TRANSACTION')
        
        # Prepare data for insertion
        questions_data = df.where(pd.notnull(df), None).values.tolist()
        
        # Insert questions
        cursor.executemany(insert_query, questions_data)
        
        # Commit transaction
        conn.commit()
        
        print(f"Successfully imported {len(questions_data)} questions.")
    except Exception as e:
        # Rollback in case of error
        conn.rollback()
        print(f"Error importing questions: {e}")
        sys.exit(1)
    finally:
        # Close connection
        conn.close()

if __name__ == '__main__':
    import_questions()

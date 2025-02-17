import sqlite3
import pandas as pd
import os

# Read the Excel file
df = pd.read_excel('/Users/academicdirector/Desktop/WCTECM/wctapp/public/wctquestionscombined.xlsx')

# Normalize difficulty levels
def normalize_difficulty(level):
    level = str(level).lower().strip()
    if level in ['easy', 'medium', 'hard']:
        return level
    return 'medium'  # Default to medium if not recognized

df['Normalized Difficulty'] = df['Difficulty Level'].apply(normalize_difficulty)

# Normalize question types
def normalize_question_type(question_type):
    """
    Normalize question type to either 'Objective' or 'Subjective'
    """
    if pd.isna(question_type):
        return 'Objective'  # Default to Objective if not specified
    
    question_type = str(question_type).lower().strip()
    
    # Mapping for different possible inputs
    objective_keywords = ['mcq', 'multiple choice', 'true/false', 'objective']
    subjective_keywords = ['short answer', 'long answer', 'essay', 'subjective']
    
    if any(keyword in question_type for keyword in objective_keywords):
        return 'Objective'
    elif any(keyword in question_type for keyword in subjective_keywords):
        return 'Subjective'
    
    return 'Objective'  # Default fallback

# Apply normalization during import
df['Question_Type'] = df['Question_Type'].apply(normalize_question_type)

# Connect to the SQLite database
db_path = '/Users/academicdirector/Desktop/WCTECM/wctapp/src/lib/database/questions.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Prepare the insert query
insert_query = '''
INSERT INTO questions (
    Question, Answer, Explanation, Subject, 
    "Module Number", "Module Name", Topic, 
    "Sub Topic", "Micro Topic", "Difficulty Level", 
    "Nature of Question", Question_Type
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
'''

# Insert data in batches to improve performance
batch_size = 100
for i in range(0, len(df), batch_size):
    batch = df.iloc[i:i+batch_size]
    
    # Convert batch to list of tuples
    data_to_insert = batch.apply(lambda row: (
        row['Question'], row['Answer'], row['Explanation'], row['Subject'],
        row['Module Number'], row['Module Name'], row['Topic'],
        row['Sub Topic'], row['Micro Topic'], row['Normalized Difficulty'],
        row['Nature of Question'], row['Question_Type']
    ), axis=1).tolist()
    
    # Execute batch insert
    cursor.executemany(insert_query, data_to_insert)
    conn.commit()
    print(f'Inserted {i+len(data_to_insert)} questions...')

# Close the connection
conn.close()

print(f'Successfully imported {len(df)} questions!')

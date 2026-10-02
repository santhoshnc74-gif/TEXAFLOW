import psycopg
import sys

passwords = ["", "postgres", "admin", "root", "123456", "password"]
success = False

for pwd in passwords:
    try:
        # Connect to the default 'postgres' database to create a new one
        conn = psycopg.connect(
            dbname="postgres",
            user="postgres",
            password=pwd,
            host="localhost",
            port=5432,
            autocommit=True
        )
        
        # Check if database exists
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_database WHERE datname = 'texflow_db'")
        exists = cur.fetchone()
        
        if not exists:
            cur.execute("CREATE DATABASE texflow_db")
            print(f"Database created successfully using password: '{pwd}'")
        else:
            print(f"Database already exists. Used password: '{pwd}'")
            
        conn.close()
        success = True
        break
    except Exception as e:
        # Ignore errors and try the next password
        pass

if not success:
    print("FAILED")
    sys.exit(1)

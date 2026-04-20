import os

src_dir = r"e:\chat\chat\Frontend\src"

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    
    # Replace the typical API_URL variable assignment
    new_content = new_content.replace(
        'const API_URL = "https://zatbackend.onrender.com"; // ✅ Production API',
        'const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "https://zatbackend.onrender.com");'
    )
    new_content = new_content.replace(
        'const API_URL = "https://zatbackend.onrender.com";',
        'const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "https://zatbackend.onrender.com");'
    )
    new_content = new_content.replace(
        'export const API_URL = "https://zatbackend.onrender.com";',
        'export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "https://zatbackend.onrender.com");'
    )
    new_content = new_content.replace(
        'export const SOCKET_URL = "https://zatbackend.onrender.com";',
        'export const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "https://zatbackend.onrender.com");'
    )
    new_content = new_content.replace(
        '`https://zatbackend.onrender.com',
        '`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "https://zatbackend.onrender.com")}'
    )

    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith((".ts", ".tsx")):
            replace_in_file(os.path.join(root, file))

print("Done")

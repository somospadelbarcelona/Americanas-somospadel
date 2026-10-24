import os
import shutil
import win32file, win32con

def copy_file_safe(src, dst):
    try:
        h = win32file.CreateFile(src, win32con.GENERIC_READ, win32con.FILE_SHARE_READ | win32con.FILE_SHARE_WRITE | win32con.FILE_SHARE_DELETE, None, win32con.OPEN_EXISTING, 0, None)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        with open(dst, 'wb') as f:
            while True:
                _, chunk = win32file.ReadFile(h, 64*1024)
                if not chunk: break
                f.write(chunk)
        win32file.CloseHandle(h)
        return True
    except Exception as e:
        return False

def clone_profile():
    src_base = r'C:\Users\acoscolin\AppData\Local\Google\Chrome\User Data'
    dst_base = r'C:\Users\acoscolin\OneDrive - GRUPO SIFU INTEGRACION LABORAL SL\Escritorio\ALEX\AMERICANAS\scraper\chrome_clone'
    
    # Copy Local State
    copy_file_safe(os.path.join(src_base, 'Local State'), os.path.join(dst_base, 'Local State'))
    
    # Copy Profile 6 essentials into Default in clone
    src_p = os.path.join(src_base, 'Profile 6')
    dst_p = os.path.join(dst_base, 'Default')
    
    items = [
        ('Preferences', 'Preferences'),
        (r'Network\Cookies', r'Network\Cookies'),
        (r'Local Storage\leveldb', r'Local Storage\leveldb'),
    ]
    
    for s_rel, d_rel in items:
        s_path = os.path.join(src_p, s_rel)
        d_path = os.path.join(dst_p, d_rel)
        if os.path.isfile(s_path):
            copy_file_safe(s_path, d_path)
        elif os.path.isdir(s_path):
            for root, dirs, files in os.walk(s_path):
                for f in files:
                    rel_f = os.path.relpath(os.path.join(root, f), s_path)
                    copy_file_safe(os.path.join(root, f), os.path.join(d_path, rel_f))
                    
    print("Clone created successfully at:", dst_base)

if __name__ == '__main__':
    clone_profile()

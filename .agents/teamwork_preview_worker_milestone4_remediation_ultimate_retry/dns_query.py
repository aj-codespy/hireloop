import socket

def query_dns():
    # We can try to query dns.google (8.8.8.8) using socket
    # or just use socket.getaddrinfo without family constraint
    try:
        print("Standard getaddrinfo:")
        print(socket.getaddrinfo("db.xiniaecawuieywlnopry.supabase.co", 5432))
    except Exception as e:
        print(f"Failed standard: {e}")
        
    try:
        print("gethostbyname:")
        print(socket.gethostbyname("db.xiniaecawuieywlnopry.supabase.co"))
    except Exception as e:
        print(f"Failed gethostbyname: {e}")

if __name__ == "__main__":
    query_dns()

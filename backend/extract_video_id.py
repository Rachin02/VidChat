from urllib.parse import urlparse, parse_qs

def extract_youtube_video_id(video_url:str):

    parse_url = urlparse(video_url)

    if parse_url.hostname in ["www.youtube.com", "youtube.com"]:
        return parse_qs(parse_url.query).get('v',[None])[0]
    if parse_url.hostname == 'youtube.be':
        return parse_url.path[1:]

    return None
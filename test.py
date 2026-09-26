
import urllib.request
import urllib.parse
import json
import time

queries = [
    'visual impairment OR blind assistant object detection OCR',
    'assistive vision YOLO',
    'repo:Mona-07/Smart-sense-assist-ai',
    'repo:yessasvini23/ContextVision-AI-Powered-Visual-Assistant-for-Accessibility',
    'repo:AnushaGaneshan06/A-web-application-for-visually-impaired-and-low-vision-people-EYE-C-',
    'repo:Bhavitejareddy/Third-Eye-For-The-Blind',
    'repo:Dawgsrlife/NeuroLens'
]

results = {}

for q in queries:
    try:
        url = 'https://api.github.com/search/repositories?q=' + urllib.parse.quote(q) + '&sort=stars&order=desc'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req)
        data = json.loads(res.read())
        for item in data.get('items', []):
            results[item['full_name']] = item
        time.sleep(1)
    except Exception as e:
        print('Error:', e)

output = []
for name, info in results.items():
    output.append({
        'name': name,
        'stars': info['stargazers_count'],
        'url': info['html_url'],
        'description': info['description'],
        'updated_at': info['updated_at']
    })

output = sorted(output, key=lambda x: x['stars'], reverse=True)
for i in output[:10]:
    print(i['name'], i['stars'], i['updated_at'])
    print(i['url'])
    print(i['description'])
    print('-'*20)

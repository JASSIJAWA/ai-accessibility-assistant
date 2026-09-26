
import urllib.request
import json

repos = [
    'Mona-07/Smart-sense-assist-ai',
    'yessasvini23/ContextVision-AI-Powered-Visual-Assistant-for-Accessibility',
    'AnushaGaneshan06/A-web-application-for-visually-impaired-and-low-vision-people-EYE-C-',
    'paavansirivardhan123/Visiona',
    'Bhavitejareddy/Third-Eye-For-The-Blind',
    'Dawgsrlife/NeuroLens'
]

for r in repos:
    try:
        req = urllib.request.Request('https://api.github.com/repos/' + r, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req)
        data = json.loads(res.read())
        print(data['full_name'], data['stargazers_count'], data['updated_at'])
    except:
        pass

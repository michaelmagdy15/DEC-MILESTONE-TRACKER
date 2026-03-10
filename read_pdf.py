import PyPDF2

def extract_text():
    with open('c:\\Users\\pc\\DEC MILESTONE TRACKER\\Performance Quality.pdf', 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text() + '\n'
        print(text)

extract_text()

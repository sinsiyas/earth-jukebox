EARTH INFORMATION JUKEBOX - STARTER PROTOTYPE
================================================

WHAT THIS IS
A beginner-friendly website prototype that demonstrates pairing a visual data series
with generated sound (sonification).

IMPORTANT
The included temperature, ocean and forest values are illustrative DEMO DATA.
They are NOT NASA observations and this prototype is NOT an official NASA product.
Before presenting NASA results, replace the demo series with verified NASA Earth
Information Center visual frames and corresponding source data, and cite the source.

FILES
- index.html : page structure
- style.css  : website design
- script.js  : interactive chart and sound generation

REQUIREMENTS
- Windows 10/11
- Python 3 installed (the `py` command should work)
- A modern browser such as Chrome or Edge
No extra Python packages are required.

HOW TO RUN ON WINDOWS
1. Extract the ZIP file.
2. Open the extracted Earth_Information_Jukebox folder in VS Code.
3. In VS Code choose Terminal > New Terminal.
4. Check the files with:
      dir
   You should see index.html, style.css, script.js and README.txt.
5. Start the local web server:
      py -m http.server 8000 --bind 127.0.0.1
6. Keep that terminal open while using the website.
7. Open Chrome or Edge and visit:
      http://127.0.0.1:8000
8. To stop the server, click the terminal and press Ctrl+C.

IF PY DOES NOT WORK
Try:
      python -m http.server 8000 --bind 127.0.0.1

IF THE PAGE IS BLANK
- Make sure you extracted the ZIP first.
- In VS Code, open the folder that directly contains index.html.
- Run `dir` and check the three files are listed.
- Save files with Ctrl+S.
- Refresh the browser with Ctrl+R.
- Check the terminal for file-not-found errors.

HOW TO USE
1. Select Temperature, Ocean or Forest.
2. Move the timeline slider to inspect a year.
3. Press Play series to hear each data point as a tone.
4. Press Stop to stop playback.
5. Adjust volume with the slider.

NEXT DEVELOPMENT TASKS FOR THE NASA CHALLENGE
1. Choose a specific NASA EIC visualization.
2. Find its matching numerical source data and metadata.
3. Document source, units, dates, geographic coverage and limitations.
4. Replace the illustrative arrays in script.js with verified data.
5. Design and test an appropriate sonification mapping with users.
6. Add keyboard and screen-reader testing and accessible descriptions.
7. Clearly explain what each sound represents.

Do not label demo values as real-time NASA data.

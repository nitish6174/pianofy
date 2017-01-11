# Pianofy
Web based application to extract piano notes from MP3 files
  
Available at : https://nitish6174.github.io/pianofy/
  
The application is based on Web Audio API (javascript)
  
#### Interface
- Upload MP3 files via drag and drop to make your playlist
- A sample playlist is also provided
- Click on a song to play it
- Use slider to control volume of original song and pianofied voice
- Keep slider fully towards original to use the application as normal music player

#### Major limitations
- Trade-off between detection of low pitch and high pitch notes due to varying frequency gap
- Multiple tracks in song with changing relative order of amplitude
- High FFT size will improve low frequency note detection but increase processing

**Note** : It is recommended to use Chrome to run the application
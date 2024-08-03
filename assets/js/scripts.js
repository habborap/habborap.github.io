document.addEventListener('DOMContentLoaded', function() {
    const listenersCount = document.getElementById('current-listeners');
    const playlistName = document.getElementById('current-playlist');
    const listenerText = document.getElementById('listener-text');
    const currentArtist = document.getElementById('current-artist');
    const currentTitle = document.getElementById('current-title');
    const currentReleaseYear = document.getElementById('current-release-year');
    const currentCover = document.getElementById('current-cover');
    const currentTime = document.getElementById('current-time');
    const endTime = document.getElementById('end-time');
    const progressBar = document.getElementById('progress');
    const tuneInButton = document.getElementById('tune-in-button');

    let currentSongEndTime = null;
    let currentSongStartTime = null;
    let popupWindow = null;

    async function fetchApiData() {
        try {
            const response = await fetch('https://api.laut.fm/station/habborap');
            const data = await response.json();

            const { api_urls, current_playlist } = data;
            const currentSongUrl = api_urls.current_song;
            const listenersUrl = api_urls.listeners;

            // Update playlist name
            playlistName.textContent = current_playlist.name;

            // Fetch and update listeners
            const listenersResponse = await fetch(listenersUrl);
            const listenersCountValue = await listenersResponse.text();
            updateListeners(listenersCountValue);

            // Fetch and update current song
            const currentSongResponse = await fetch(currentSongUrl);
            const currentSongData = await currentSongResponse.json();
            updateCurrentSong(currentSongData);

            // Update the start and end time for the current song
            currentSongStartTime = new Date(currentSongData.started_at);
            currentSongEndTime = new Date(currentSongData.ends_at);

            // Tune in button
            tuneInButton.addEventListener('click', () => {
                if (popupWindow && !popupWindow.closed) {
                    popupWindow.focus();
                } else {
                    popupWindow = window.open(data.stream_url, '_blank', 'width=400,height=300');
                    if (popupWindow) {
                        popupWindow.focus();
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching API data:', error);
        }
    }

    function updateListeners(count) {
        listenersCount.textContent = count;
        listenerText.textContent = count === '1' ? 'Hörer' : 'Hörern';
    }

    async function fetchCoverArt(song) {
        try {
            const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(song.artist.name + ' ' + song.title)}&limit=1`, {
                mode: 'no-cors'
            });
            const data = await response.json();
            if (data.results.length > 0) {
                return data.results[0].artworkUrl100;
            }
        } catch (error) {
            console.error('Error fetching cover art:', error);
        }
        return 'assets/images/default_cover.png';
    }

    async function updateCurrentSong(song) {
        currentArtist.textContent = song.artist.name;
        currentTitle.textContent = song.title;
        currentReleaseYear.textContent = song.releaseyear;
        currentCover.src = await fetchCoverArt(song);

        // Update the start and end time
        currentSongStartTime = new Date(song.started_at);
        currentSongEndTime = new Date(song.ends_at);

        // Format and display the times
        currentTime.textContent = formatTimeElapsed(new Date(), currentSongStartTime);
        endTime.textContent = formatTimeElapsed(currentSongEndTime, currentSongStartTime);

        // Start updating the progress bar
        updateProgressBar();
    }

    function formatTimeElapsed(endTime, startTime) {
        const diff = endTime - startTime;
        const minutes = Math.floor(diff / 60000).toString().padStart(2, '0');
        const seconds = ((diff % 60000) / 1000).toFixed(0).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    function updateProgressBar() {
        if (currentSongStartTime && currentSongEndTime) {
            const now = new Date();
            const totalDuration = currentSongEndTime - currentSongStartTime;
            const elapsedTime = now - currentSongStartTime;
            const progress = Math.min(100, (elapsedTime / totalDuration) * 100);
            progressBar.style.width = progress + '%';

            currentTime.textContent = formatTimeElapsed(now, currentSongStartTime);

            if (now >= currentSongEndTime) {
                fetchApiData();
            } else {
                requestAnimationFrame(updateProgressBar);
            }
        }
    }

    // Fetch API data on page load
    fetchApiData();
});

### Feature Specification: Smart Audio Playback

**Function Description**
An audio system that responds to recognized objects sequentially (Round Robin), locks re-recognition during playback, and filters low-confidence results.

**Functional Requirements**

1.  **Audio Lock (Blocking Recognition)**
    *   The system must pause the object recognition process or ignore recognition results while an audio file is playing.
    *   Listening (recognition) resumes automatically only after the current audio playback has completely finished.

2.  **Multiple Audio Files per Class (Round Robin)**
    *   Each figurine class can have multiple assigned audio files (inside media folder).
    *   The system must support filenames following the format: `{class_name}{index}` (e.g., `cow1.mp3`, `cow2.mp3`, `cow3.mp3`).
    *   Audio playback for a given class must cycle in a loop (Round Robin):
        *   First recognition -> `audio1`
        *   Second recognition -> `audio2`
        *   ...
        *   After the last audio -> return to `audio1`.

3.  **Trigger on Class Change**
    *   Audio should be played only when a **change** in the dominant class is detected.
    *   *Scenario:* If the system recognizes "Cow" -> "Cow" -> "Cow", the sound plays only once. If the detection changes from "Cow" -> "Horse", the audio for the "Horse" class is played.

4.  **Confidence Threshold**
    *   An object is considered correctly recognized only if the confidence score exceeds **85%**.
    *   Results below this threshold are treated as "no recognition" or noise and do not trigger any audio action or state change.

**Technical Requirements**
*   Implementation of an `isAudioPlaying` flag to track the player state.
*   A per-class playback index counter stored in the browser's session memory.
*   Handling of the `onended` event for the HTMLAudioElement to unlock the recognition loop.

***

**User Story Example**
> A user shows a firefighter figurine to the camera. The application recognizes it with 92% confidence (above the 85% threshold). It plays the file `firefighter1.mp3`. While the sound is playing, the child waves another figurine, but the application ignores it (lock). After the sound finishes, the child shows the firefighter again. The application plays the next file in the series, `firefighter2.mp3`.

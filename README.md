# [TXBA Lick Entry](https://script.google.com/macros/s/AKfycbyo-M3mNP5UrrJxnfe3-ncKWZMFUNTARkVbKEFTBKk/dev) 

- [TXBA Lick Entry](#txba-lick-entry)
  - [Purpose](#purpose)
  - [Composition](#composition)
  - [WorkFlow](#workflow)
  - [Features](#features)
    - [_Form validation_](#form-validation)
    - [_Navigation_](#navigation)
    - [_Search_](#search)
    - [_Embedded Soundslice Player_](#embedded-soundslice-player)
    - [_Options / Misc_](#options--misc)
      - [Settings and Utilities](#settings-and-utilities)
      - [Misc](#misc)

 ## Purpose
 TXBA wants to quantify all licks in all courses to determine playabilty categories. As of now, the criteria for a lick are as follows:

 * Total # of notes/note groupings
 * Timing Difficulty
 * Speed Difficulty
 * What "Blues Boxes" are we using
 * On which chord of the progression is the lick being played
 * Intensity
 * Picking Difficulty
 * Fingering Difficulty
 * Bending Count 
 * Legato Count
 * Has Slides?
 * Has Mutes?
 * Has Vibrato


  ## Composition
  Google Sheet - database
  Google Apps Script - backend
  ChartJS - display
  Datatables - display

  ## WorkFlow
  Choose Course -> Choose Lick -> Search for DB data -> Fill in form -> Save/Update 

 ## Features
 ### _Form validation_
 - Per section
  ![section_validation](images/LE_valid1.png)
  ![section_validation](images/LE_valid2.png)

 - Whole Form
  ![section_validation](images/LE_valid3.png)
  ![section_validation](images/LE_valid4.png)
  
  ### _Navigation_ 
  - By lick title 
    - Populated after choosing a course
    - Autocomplete
  ![nav2](images/LE_nav2.png)
  - Prev/Next 
    - Provides easy movement between licks
  ![nav1](images/LE_nav1.png)

  ### _Search_
  Automatically...
 1. retrieves lick data from spreadsheet 
    - (lick name, loop start and end)
 2. (with [Auto-play option](#autoplay)) Begins playing the selected link
 3. (with [Enable Landscape Graphs](#landscape)) shows the lick index
 ![Isolated Lick Landscape](images/LE_graph2.png)


 ### _Embedded Soundslice Player_
 ![Soundslice player](images/LE_ss1.png)
  
  ### _Options / Misc_ 
  #### Settings and Utilities
  ![options](images/LE_opts1_b.png)
- Enable Landscape Graphs (default = unchecked)
  - enables course landscape button
- Auto-play Licks (default = checked) <a name="autoplay"></a>
- Course Landscape button (dual purpose)<a name="landscape"></a>
  - view course landscape (req: Course title, no lick selected)
    - ![course landscape graph](images/LE_graph1.png)
  - view lick landscape (req: Course title and lick)
    - ![course landscape graph](images/LE_graph3.png)
- Set Lick 
  - selects/plays loop (req: Auto-play unchecked, Course title and lick)
- Read all 
  - displays the current data in the spreadsheet without having to open it

#### Misc
- Link to Google sheet 
  - open actual sheet in another tab
![link to GSheet](images/LE_opt2.png)
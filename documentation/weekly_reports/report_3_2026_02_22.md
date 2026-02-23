
Capstone Project Weekly Report No. 3
Timeframe: 2026-02-16 – 2026-02-22

-----------------------------------------------------------------------------------------

Group Information
Group name: The Potatoes

-----------------------------------------------------------------------------------------

Members:

Cooper Witte
Gavin Sloan
Christian Thede
Nova Solarz (it/they/she)

-----------------------------------------------------------------------------------------

Summary of Activities This Week:

Christian -

Cooper - Started initalizing subnodes from Gavin's graph into the A* algrotihm code, as well as establishing the connections between these new subnodes
         and the building nodes created last week.

Gavin - 

-----------------------------------------------------------------------------------------

Progress Made

Nova - 

Christian -

Cooper - I started listing down each subnode with their longitude and latitude coordinates into our Excel spreadsheet that contains information on the building nodes.          Following this, I added these new entries to my code in order to add them to the A* graph. There are a lot of subnodes still remaning that need to be                  initialized in the code; most of what has been added is from the east side of UNK's campus. After testing the code with the new subnodes added, there were             not any runtime errors and the total distance seems to be calculating correctly. However, there some current things happening with A* itself that might not            be correct. I will discuss these issue in the "Challenges and Issues Encountered" section. Overall, decent progess has been made, but there is still a lot of          work that needs to be done.

Gavin - 

-----------------------------------------------------------------------------------------

Challenges or Issues Encountered:

Christian - 

Cooper - The main issue I have encounteres so far comes from the current results I am getting from running my code. My current results are partially correct in that            the nodes are finding each other correctly and calculating the correct distance, but at the same time the heuristic value stays at 0 the entire time the               algorithm runs. The final path, which is supposed to track the starting and ending nodes as well as the subnodes in between, is not returning correct values.          It is currently only showing the ending node, which makes me beleive something is wrong with the logic of how the subnodes are being stored in the path. I am          also working with a very small sample size of subnodes, which might be the reason why I am having these issues since there isn't much "learning" to finding            the best path. I'm sure fixing these problems won't be too challenging, but trying to fix the logic while also adding the remaining subnodes (which is a lot)          is going to take a lot of time.

Gavin - 

Nova - 

-----------------------------------------------------------------------------------------

Plans for Next Week:

Christian -

Cooper - Next week, I plan on continuing the process of listing subnodes into our Excel spreadsheet and initalizing them into the A* code. I also will need to do some          research and troubleshooting to figure out why the heurisitc value isn't calculating anything and why the path isn't being printed out correctly. If I think           it is necessary, I would like to speak with Nathan Roth about my code and see if he would have any advice for correcting the current logic of my algorithm,            since I feel that may be what is causing the current issues with the results.

Gavin - 

Nova - 

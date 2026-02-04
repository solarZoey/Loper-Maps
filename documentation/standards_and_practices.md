# Standards and Practices

## Filenames

### Classes
For all class files, the filename should be in **snakes case, first letter of each word capitalized**.

e.g.: `Graph_Node.py`, `App_Driver.java`, etc.

### All other files 
snakes case, all lowercase.

e.g.: `this_file.md`, `that_file_over_there.html`, etc.

## File Organization

> [!NOTE]
> Files can be placed outside of these rules with majority agreement from a team meeting.

All files related directly to the application functioning should be placed under [`/src/`](/src)
- files related to front-end will be placed in [`/src/front-end/`](/src/back-end)
	- images should be placed into [`/src/front-end/images/`](/src/front-end/images), create sub-directories to group images by similar theme/function.
- files related to back-end will be placed in [`/src/back_end/`](/src/back_end)

All files related documentation should be placed under [`/documentation/`](/documentation)
- weekly reports placed in [`/documentation/weekly_reports/`](/documentation/weekly_reports)
	- weekly reports should be written in Markdown (`.md`)

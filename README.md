# d2l-course-content-report

We are trying to make html page that lives in d2l that creates a csv report of all the topcics that are in a d2l course. 

## Format of CSV

| module 1  | module 2      | module 3 |
| --------- |-------------  | ---------|
| module 1a | module 2a     | module 3a|
| module 1b | module 2b     | module 3b|
| module 1c | module 2c     | module 3c|
|           | module 2d     | module 3d|
|           | module 2d     |          |

Each column reperents a module in the toc at the root level. 

Each row lists all the topics in order, in that module no matter how deeply nested they are in submodules.

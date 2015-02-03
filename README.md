# exp-tracker
web app expense tracker as MEAN test project

# Installation
First make sure node.js and MongoDB are installed.  They can be found at http://nodejs.org/ and http://www.mongodb.org/ respectively.
Next you can either fork or clone this repository onto your local machine.  (Fork if you want to edit it into your own project, clone if you just want to run this one)

Once you have a copy installed go into your node.js command prompt and cd to your working directory. For example <code>C:\Projects\ExpTracker</code>
Once there, type <code>npm install</code>
This will install all the library dependencies. Once that completes, you need to create a folder that will house the data that the program generates as you input expenses.. This will go in <code>C:\Projects\ExpTracker\data</code>
in this example. To do this, make sure you are in <code>C:\Projects\ExpTracker</code> and type <code>md data</code>

# Running the program
Next, open up another command prompt window and cd to the directory you installed MongoDB which will probably look something like:
<code>C:\Program Files\MongoDB 2.6 Standard\bin</code> From there execute the following command:

<code>mongod --dbpath c:\Projects\ExpTracker\data</code>

In the first command prompt window, make sure you are in <code>C:\Projects\ExpTracker</code> and type <code>npm start</code>

That should be it, now you can point your browser to http://localhost:3000 to see the program

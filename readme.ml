Start on Home
	-identify servers
		-Determine number of agents that can be run on these servers
			-Create agents
	-Prioritize servers
		- Create function to determine priority (based something like maxMoney/hackDifficulty)
	-Weaken
		-Look at current security level compared to min security
			-Run enough weaken threads to reduce security level to min
	-Grow
		-Look at current money level compared to max money
			-Run enough grow threads to get money to max
		-run enough weaken threads to counteract security increase from grow
	-Hack
	
	
	
	
	
Main Cycle
	We have current stats, used to determine next action
		When initiating the action, keep track of the expected changes
			Use this updated data to determine the next action
			
			
Tasks:
	-function to prioritize servers
		-once at init? or continuously?
	-Track tasks to inform when additional threads should start
	-develop analytics to determine which threads to run
	
	
	
	

Action happens
	Get info on
		Time complete
		Effect
		Server affected
		
	Server tracking
		initial
		
		Update method(timestamp, adjustment)
			* This will keep track of the time when an affect will take place
			
		
		Get data for piroitization(script runtime)
			* Can use runtime + previous updates to determine what the state of the server will be at the point in time when the script completes.
				How to deal with ongoing updates that won't complete 
				
Intelligence levels:
1. Hack OR grow OR weaken
2. Weaken to min, and hack or grow
3. balance hack grow and weaken to counteract each other for the current iteration
	Weaken to min
	Have a high-sec threshold
	Run tasks until we hit high-sec
	weaken to min
4. predictive anaylsis with tasks.
			
	
	Open Questions
	- Do we want to run weaken on all servers first? 
		- Or we can say something like no more than X % weaken threads so that hacks can happen at the same time
		
		ANSWER: Prioritize one server before moving on to the next
		
		
	- When it's time to hack, how much money to take?
		
		g = growth rate
		x = number of runs
		i = initial
		
		(i*g) ^ x <= hack threshold
		


	- How to deal with chance of hacks failing?
		- Get hack chance and use that to calculate the average number of needed threads
			* We'll have to make sure our low-point threshold is high enough to account for more successes than expected
			
			
			
			0.5 = x * (how much steal per thread) * (failure rate)
	
	
	
Hacking a servers is in two stages
	1) Initial Weaken
	2) Grow, hack, Upkeep
	

	1)
		Only weaken until it gets to the security you want
		
	2)
		Go between hack and grow depending on circumstances
			* Always follow-up with weaken to counteract increased security
	
		Logic:
			If money > 95%
				Hack :D
			else
				Weaken :D
				
			Weaken to counteract

	
	
	

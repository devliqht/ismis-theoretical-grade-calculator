# ISMIS Theoretical Grade Calculator

A client-side script that modifies the individual grade cell values to add an edit button. Features dynamic calculation of GPA and GWA based on inputted cell values.

## NOTE
- This is a client side script only and **WILL NOT** edit your grades in the ISMIS/USC database. 
- Grades highlighted in blue (NSTP) are not included in GPA/GWA calculation. Although they might be included in the GWA calculation since total units earned include NSTP (per observation), I'm not very sure of it since manual calculations showed a different GWA w/ NSTP. Your actual GWA might differ.
- Idk if this is legal 

## Usage
#### Method 1 (manual)
1. Copy the entire code from ``src/grade-calculator.js``.
2. Open Dev Tools when you are in the View Grades page and open the Console tab.
3. Paste the code. It should run automatically.

#### Method 2 (semi-manual)
1. Open Dev tools when you are in the View Grades page and open the console tab.
2. Paste this code. It should run automatically. 
	```js
	(function() {
	    const script = document.createElement('script');
	    script.src = 'https://tutorial.dcism.org/code/grade-calculator.js';
	    script.async = true;
	    document.head.appendChild(script);
	})();
	```
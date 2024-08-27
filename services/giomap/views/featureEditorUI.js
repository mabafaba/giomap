
class FeatureEditor {
    constructor(parentNode) {
        this.parentNode = parentNode;
        this.rows = [];
        this.#loadDependencies().then(() => {
            this.#initializeFeatureEditorUI();
        })
        .catch((error) => {
            console.error('Failed to load dependencies:', error.message);
        });


        // add html elements to the parent node
        
    }

   #loadDependencies() {
        return new Promise((resolve, reject) => {
            let cssLoaded = false;
            let jsLoaded = false;

            // Load tagify CSS
            const tagifyCSS = document.createElement('link');
            tagifyCSS.rel = 'stylesheet';
            tagifyCSS.href = 'https://cdn.jsdelivr.net/npm/@yaireo/tagify/dist/tagify.css';
            tagifyCSS.onload = () => {
                cssLoaded = true;
                if (cssLoaded && jsLoaded) {
                    resolve();
                }
            };
            tagifyCSS.onerror = () => {
                reject(new Error('Failed to load tagify CSS'));
            };
            document.head.appendChild(tagifyCSS);

            // Load tagify JS
            const tagifyJS = document.createElement('script');
            tagifyJS.src = 'https://cdn.jsdelivr.net/npm/@yaireo/tagify/dist/tagify.js';
            tagifyJS.onload = () => {
                jsLoaded = true;
                if (cssLoaded && jsLoaded) {
                    resolve();
                }
            };
            tagifyJS.onerror = () => {
                reject(new Error('Failed to load tagify JS'));
            };
            document.head.appendChild(tagifyJS);
        });
    }

    
    #initializeFeatureEditorUI(){
        // Create the table
        var table = document.createElement('table');
        table.id = 'featureEditorTable';
        this.parentNode.appendChild(table);
        // Create the table body
        var tbody = document.createElement('tbody');
        table.appendChild(tbody);
        // button that adds a new feature at the end of the table
        var button = document.createElement('button');
        
        button.innerText = '+';
        button.addEventListener('click', () => this.addRow());
        this.parentNode.appendChild(button);
        this.addRow('garbage can', ['recycle', 'compost', 'landfill']);
        
        // add button to log data to console
        var logButton = document.createElement('button');
        // down arrow ascii character for button text
        logButton.innerText = '↓';
        
        logButton.addEventListener('click', () => console.log(this.data));
        this.parentNode.appendChild(logButton);
    }    

    addRow(name = '', values = []) {
        // Create a new table row for the feature
        var tr = document.createElement('tr');
        // new unique id: max existing id + 1, unless this is the first feature, in which case the id is 0
        var id = this.rows.length > 0 ? Math.max(...this.rows.map(f => f.id)) + 1 : 0;
        tr.id = id;
        
        tr.classList.add('featureRow');
        
        // Create the first column for the feature name
        var td1 = document.createElement('td');
        td1.classList.add('featureName');
        var featureNameInput = document.createElement('input');
        featureNameInput.setAttribute('placeholder', 'data field name');
        // default content
        featureNameInput.value = name;
        td1.appendChild(featureNameInput);
        tr.appendChild(td1);
        
        // Create the second column for the feature value options
        var td2 = document.createElement('td');
        td2.classList.add('featureValues');
        var featureValueInput = document.createElement('input');
        featureValueInput.setAttribute('placeholder', 'options');
        featureValueInput.classList.add('tagifyInputField');
        // default content
        
        
        td2.appendChild(featureValueInput);
        tr.appendChild(td2);
        
        // Create the third column for the remove feature button
        var td3 = document.createElement('td');
        var button = document.createElement('button');
        
        // set button to call this objects removeRow method with the index of the feature to remove
        button.addEventListener('click', () => this.removeRow(id));
        button.innerText = 'x';
        td3.appendChild(button);
        tr.appendChild(td3);
        
        // Add the created feature row to the array of features
        this.rows.push(tr);
        
        // Add the created feature row to the table
        this.parentNode.getElementsByTagName('tbody')[0].appendChild(tr);
        
        // tagify
        featureValueInput.tagify = new Tagify(featureValueInput);
        // add example values
        featureValueInput.tagify.addTags(values.map(value => ({ value: value })));
        // Return the created table row
        return tr;
    }
    
    removeRow(id) {
        // Remove the feature from the array of features where the id matches
        var index = this.rows.findIndex(f => f.id == id);
        
        // Remove the feature from the table
        this.parentNode.getElementsByTagName('tbody')[0].removeChild(this.rows[index]);
        
    }
    
    get data() {
        // loop over rows and update feature values
        // for each row, get the feature name and feature values
        // update the feature values in the features array
        
        // get all rows
        var rows = this.parentNode.getElementsByTagName('tr');
        
        // loop over rows
        var features = [];
        for (var i = 0; i < rows.length; i++) {
            // get feature name and feature values
            var featureName = rows[i].getElementsByTagName('td')[0].getElementsByTagName('input')[0].value;
            var featureValues = rows[i].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
            // json parse, empty array if empty string or no values
            if (featureValues == '') {
                featureValues = [];
            } else {
                featureValues = JSON.parse(featureValues).map((value) => value.value);
            }
            
            features.push({ name: featureName, values: featureValues });
        }
        return features;
    }
}

// expose
window.FeatureEditor = FeatureEditor;
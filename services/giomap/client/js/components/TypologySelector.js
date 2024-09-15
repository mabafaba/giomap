


class TypologySelector {
    constructor(typologies, selectedTypology, onsubmit, data) {
        this.typologies = typologies;
        this.html = this.buildHtml()
        this.typologyPropertiesForm = new TypologyPropertiesForm(selectedTypology, data, onsubmit);
        
        // if only one option exists, set typology
        if(this.typologies && this.typologies.length==1){
            this.update(typologies[0]);
        }
        
        // update form when typology changes
        this.html.addEventListener('change', (e) => {
            // find typology 
            var typology = this.typologies.find(t => t.name === e.target.value);
            this.update(typology);
        });
    }
    
    get data(){
        return this.typologyPropertiesForm.data;
    }
    
    update(typology, data){
        // check if typology exists in typologies
        if(typology){
            var typologyFound = this.typologies.find(t => t.name === typology.name);
            
            if(!typologyFound){
                console.error("Typology not found in typologies", typology);
                return;
            }
            
            // set input field value
            this.html.value = typology.name;
        }
        // update form fields and data
        this.typologyPropertiesForm.update(typology, data)
        
    }
    
    buildHtml() {
        var typologySelector = document.createElement('select');
        typologySelector.class = "typologySelector";
        typologySelector.name = "typologySelector";
        typologySelector.style.width = "100%";
        typologySelector.style.marginBottom = "10px";
        // larger font size
        typologySelector.style.fontSize = '1.3em';
        typologySelector.style.fontWeight = 'bold';
        typologySelector.style.color = 'white';
        
        
        
        // empty default option
        
        // if more than one type
        if(this.typologies.length > 1){
            var emptyOption = document.createElement('option');
            emptyOption.hidden = true;
            emptyOption.disabled = true;
            emptyOption.selected = true;
            emptyOption.value = "";
            emptyOption.innerHTML = "select type";
            
            typologySelector.appendChild(emptyOption);
        }
        // one option per typology
        this.typologies.forEach(function(typology) {
            var option = document.createElement('option');
            option.value = typology.name;
            option.innerHTML = typology.name;
            typologySelector.appendChild(option);
        });
        
        return typologySelector;
    }
    
    selectedTypologyName() {
        return this.html.value;
    }
    
    selectedTypology() {
        return this.typologies.find(typology => typology.name === this.selectedTypologyName());
    }
    
    
}




class TypologyPropertiesForm {
    constructor(typology, data, onsubmit) {
        
        this.typologyPropertiesFormGroup = null;
        this.form = null;
        this.onsubmit = onsubmit;
        this.createFormStructure();
        
        if(typology){
            this.typology = typology;
        }
        
        if(typology && data){
            this.updateData(data);
        }
        
        if(!typology && data){
            throw new Error("can't fill form data without typology");
        }
        
    }
    
    createFormStructure() {
        this.form = document.createElement('form');
        this.form.id = "popupForm";
        this.form.className = "popupForm";
        this.form.addEventListener("submit", this.onsubmit);
        this.form.addEventListener("cancel", this.onsubmit);
        
        this.typologyPropertiesFormGroup = document.createElement('div');
        this.typologyPropertiesFormGroup.className = "form-group-user-defined-properties";
        this.typologyPropertiesFormGroup.id = "typologyPropertiesFormGroup";
        
        this.form.appendChild(this.typologyPropertiesFormGroup);
        
        var saveButton = document.createElement('button');
        saveButton.type = "submit";
        saveButton.name = "action";
        saveButton.value = "save";
        saveButton.innerHTML = "Save";
        saveButton.style.marginRight = "5px";
        this.form.appendChild(saveButton);
        
        var cancelButton = document.createElement('button');
        cancelButton.type = "submit";
        cancelButton.name = "action";
        cancelButton.value = "cancel";
        cancelButton.innerHTML = "Cancel";
        this.form.appendChild(cancelButton);
    }
    
    update (typology, data){
        if(typology){
            this.updateTypology(typology);
        }
        if(data){
            this.updateData(data);
        }
    }
    updateTypology(typology) {
        if(!typology){
            console.error("can't update form without typology");
            return;
        }
        this.typology = typology;
        this.updatePropertyInputFields(typology);
    }
    
    updatePropertyInputFields(typology) {
        this.typologyPropertiesFormGroup.innerHTML = "";
        if(!typology){
            this.typology = null;
            return;
        }
        
        typology.properties.forEach((field) => {
            var fieldLabel = document.createElement('label');
            fieldLabel.for = field.name;
            fieldLabel.innerHTML = field.name;
            this.typologyPropertiesFormGroup.appendChild(fieldLabel);
            this.typologyPropertiesFormGroup.appendChild(document.createElement('br'));
            
            if (field.type === 'text') {
                var fieldInput = document.createElement('input');
                fieldInput.id = field.name;
                fieldInput.name = field.name;
                fieldInput.placeholder = field.name;
                fieldInput.style.width = "100%";
                fieldInput.style.marginBottom = "10px";
                fieldInput.rows = 1;
                fieldInput.cols = 20;
                this.typologyPropertiesFormGroup.appendChild(fieldInput);
            }
            
            if (field.type === 'categorical') {
                var fieldSelect = document.createElement('select');
                fieldSelect.id = field.name;
                fieldSelect.name = field.name;
                fieldSelect.innerHTML = field.name;
                fieldSelect.style.width = "100%";
                fieldSelect.style.marginBottom = "10px";
                
                var emptyOption = document.createElement('option');
                emptyOption.hidden = true;
                emptyOption.disabled = true;
                emptyOption.selected = true;
                emptyOption.value = "";
                emptyOption.innerHTML = "select";
                fieldSelect.appendChild(emptyOption);
                field.categoricalValues.forEach((value) => {
                    var option = document.createElement('option');
                    option.value = value;
                    option.innerHTML = value;
                    fieldSelect.appendChild(option);
                });
                
                this.typologyPropertiesFormGroup.appendChild(fieldSelect);
            }
            
            this.typologyPropertiesFormGroup.appendChild(document.createElement('br'));
        });
    }
    
    setPropertyValue(field, value) {
        if(!this.typology){
            console.error("can't set property value without typology");
            return;
        }
        // warn if unknown fields are present
        if (!this.typology.properties.find((f) => f.name === field.name)) {
            console.warn(`Unknown field ${field.name} in data, value:`, value);
        }
        if (field.type === 'text') {
            var input = this.typologyPropertiesFormGroup.querySelector(`input[name="${field.name}"]`);
            input.value = value;
        }
        if (field.type === 'categorical') {
            var select = this.typologyPropertiesFormGroup.querySelector(`select[name="${field.name}"]`);
            select.value = value;
        }
    }
    
    updateData(data) {
        // warn if unknown fields are present
        
        if(!data){
            console.warn("no data to update form with");
            return;
        }
        
        Object.keys(data).forEach((key) => {
            if (!this.typology.properties.find((field) => field.name === key)) {
                console.warn(`Unknown field ${key} in data, value:`, data[key]);
            }
        });
        
        
        
        if(!this.typology){
            console.error("can't set property value without typology");
            return;
        }
        
        
        this.typology.properties.forEach((field) => {
            if (data[field.name]) {
                this.setPropertyValue(field, data[field.name]);
            } else {
                this.setPropertyValue(field, "");
            }
        });
    }
    get data() {
        // error if no typology
        if(!this.typology){
            // warn
            console.warn("no typology set, returning empty object");
            // return empty object
            return {};
        }
        
        var data = {};
        this.typology.properties.forEach((field) => {
            if (field.type === 'text') {
                var input = this.typologyPropertiesFormGroup.querySelector(`input[name="${field.name}"]`);
                data[field.name] = input.value;
            }
            if (field.type === 'categorical') {
                var select = this.typologyPropertiesFormGroup.querySelector(`select[name="${field.name}"]`);
                data[field.name] = select.value;
            }
        });
        return data;
    }
}




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
        console.log("TypologyPropertiesForm constructor", typology, data);
        if(typology){
            this.updateTypology(typology);
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
        console.log("updatePropertyInputFields", typology);
        if(!typology){
            this.typology = null;
            return;
        }
        this.typologyPropertiesFormGroup.innerHTML = "";
        
        typology.properties.forEach((field) => {
            console.log('field',field);

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

            if(field.type === 'youtube'){
                console.log('adding youtube field');
                var videoInput = document.createElement('input');
                videoInput.name = field.name;
                videoInput.placeholder = 'Enter YouTube link';
                videoInput.style.width = "100%";
                videoInput.style.marginBottom = "10px";
                this.typologyPropertiesFormGroup.appendChild(videoInput);

                var videoEmbed = document.createElement('iframe');
                videoEmbed.id = `${field.name}_embed`;
                videoEmbed.style.width = "100%";
                videoEmbed.style.height = "315px";
                videoEmbed.style.marginBottom = "10px";
                videoEmbed.frameBorder = "0";
                videoEmbed.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
                videoEmbed.allowFullscreen = true;
                videoEmbed.style.display = 'none';
                this.typologyPropertiesFormGroup.appendChild(videoEmbed);

                videoInput.addEventListener('input', (e) => {
                    var url = e.target.value;
                    var embedUrl = validateYoutubeURL(url);
                    if (embedUrl) {
                        console.log('EMBEDURL', embedUrl);
                        videoEmbed.src = embedUrl;
                        // set to visible
                        videoEmbed.style.display = 'block';
                    } else {
                        videoEmbed.src = '';
                        // hide iframe
                        videoEmbed.style.display = 'none';
                    }
                });
            }

            if (field.type === 'soundcloud') {
                

                var soundcloudInput = document.createElement('input');
                
                soundcloudInput.name = field.name;
                soundcloudInput.placeholder = 'Enter SoundCloud link';
                soundcloudInput.style.width = "100%";
                soundcloudInput.style.marginBottom = "10px";
                this.typologyPropertiesFormGroup.appendChild(soundcloudInput);

                var soundcloudEmbed = document.createElement('iframe');
                var url = soundcloudInput.value;


                    var embedUrl = validateSoundCloudURL(url);
                    if (embedUrl) {
                        soundcloudEmbed.src = embedUrl;
                        soundcloudEmbed.style.display = 'block';
                    } else {
                        soundcloudEmbed.src = '';
                        soundcloudEmbed.style.display = 'none';

                    }
                soundcloudEmbed.id = `${field.name}_embed`;
                soundcloudEmbed.style.width = "100%";
                soundcloudEmbed.style.height = "166px";
                soundcloudEmbed.style.marginBottom = "10px";
                soundcloudEmbed.frameBorder = "0";
                soundcloudEmbed.allow = "autoplay";
                this.typologyPropertiesFormGroup.appendChild(soundcloudEmbed);

                soundcloudInput.addEventListener('input', (e) => {
                    var url = e.target.value;
                    var embedUrl = validateSoundCloudURL(url);
                    if (embedUrl) {
                        console.log('setting src', embedUrl);
                        soundcloudEmbed.src = embedUrl;
                        soundcloudEmbed.style.display = 'block';
                    } else {
                        console.log('hiding soundcloud');
                        soundcloudEmbed.src = '';
                        soundcloudEmbed.style.display = 'none';
                    }
                });
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
            console.warn(`Unknown field ${field.name} in data, value: ${value}`);
        }
        if (field.type === 'text') {
            var input = this.typologyPropertiesFormGroup.querySelector(`input[name="${field.name}"]`);
            input.value = value;
        }
        if (field.type === 'categorical') {
            var select = this.typologyPropertiesFormGroup.querySelector(`select[name="${field.name}"]`);
            select.value = value;
        }

        if (field.type === 'youtube') {
            var input = this.typologyPropertiesFormGroup.querySelector(`input[name="${field.name}"]`);
            input.value = value;
            embedUrl = validateYoutubeURL(value);
            if(embedUrl){
                console.log('showing youtube', embedUrl);
            var youtubeEmbed = this.typologyPropertiesFormGroup.querySelector(`iframe[id="${field.name}_embed"]`);
            console.log('youtubeEmbed', youtubeEmbed);
            console.log('setting display block');
            youtubeEmbed.style.display = 'block';
            console.log('setting src', embedUrl);
            youtubeEmbed.src = embedUrl;
            } else {
                // hide iframe
                console.log('hiding youtube');
                

                var youtubeEmbed = this.typologyPropertiesFormGroup.querySelector(`iframe[id="${field.name}_embed"]`);
                youtubeEmbed.src = '';
                youtubeEmbed.style.display = 'none';
            }
        }

        if (field.type === 'soundcloud') {
            var input = this.typologyPropertiesFormGroup.querySelector(`input[name="${field.name}"]`);
            input.value = value;
            var embedUrl = validateSoundCloudURL(value);
            var soundcloudEmbed = this.typologyPropertiesFormGroup.querySelector(`iframe[id="${field.name}_embed"]`);
            if (embedUrl) {
                soundcloudEmbed.src = embedUrl;
                soundcloudEmbed.style.display = 'block';
            } else {
                soundcloudEmbed.src = '';
                soundcloudEmbed.style.display = 'none';
            }
        }
    }
    
    updateData(data) {
        // warn if unknown fields are present
        
        if(!data){
            console.warn("no data to update form with");
            return;
        }

        if(!this.typology){
            console.error("can't set property value without typology");
            return;
        }

        Object.keys(data).forEach((key) => {
            if (!this.typology.properties.find((field) => field.name === key)) {
                console.warn("Unknown field " + key + " in data, value", data[key]);
            }
        });
        
        
        
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
        console.log("get data", this.typology);
        console.log('this', this);
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

            if (field.type === 'youtube') {
                var input = this.typologyPropertiesFormGroup.querySelector(`input[name="${field.name}"]`);
                data[field.name] = input.value;
            }
            if (field.type === 'soundcloud') {
                var input = this.typologyPropertiesFormGroup.querySelector(`input[name="${field.name}"]`);
                data[field.name] = input.value;
            }
        });
        return data;
    }
}


function validateYoutubeURL(url) {    
    if (url != undefined || url != '') {
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
        var match = url.match(regExp);
        if (match && match[2].length == 11) {
            return( 'https://www.youtube.com/embed/' + match[2] + '?autoplay=0');
        } else {
            return false;
        }
    }
    return false;
}

function validateSoundCloudURL(url) {
    if (url != undefined || url != '') {
        var regExp = /^https?:\/\/(soundcloud\.com|snd\.sc)\/(.*)$/;
        var match = url.match(regExp);
        if (match) {
            return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
        } else {
            return false;
        }
    }
    return false;
}

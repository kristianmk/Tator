class TypeForm extends TatorElement {
  constructor() {
    super();

    // Correct name for the type, ie. "LocalizationType"
    this.typeName = "";
    this.readableTypeName = "";

    // Main Div
    this.typeFormDiv = document.createElement("div");
    this.typeFormDiv.setAttribute("class", "pl-md-6")
    this._shadow.appendChild(this.typeFormDiv);

    // Required helpers.
    this.attributeFormHelper = new AttributesForm();

    // Loading spinner
    this.loading = new LoadingSpinner();
    this._shadow.appendChild(this.loading.getImg());

    // Init hide attributes
    this._hideAttributes = false;

    // Init button early
    this.saveButton = document.createElement("input");
    this.savePost = document.createElement("button");
  }

  _init({ data, modal, sidenav, versionListHandler, mediaListHandler, clusterListHandler, isStaff }) {
    // Log to verify init
    // console.log(`${this.readableTypeName} init.`);
    // console.log(data);

    // Initial values
    this.data = data;
    this.modal = modal;
    this.projectId = this.data.project;
    this.typeId = this.data.id
    this.sideNav = sidenav;
    this.versionListHandler = versionListHandler;
    this.mediaListHandler = mediaListHandler;
    this.clusterListHandler = clusterListHandler;
    this.isStaff = isStaff;

    // Pass modal to helper
    this.boxHelper = new SettingsBox(this.modal);

    // Add form to page
    this.setupFormPage(data)
  }

  async setupFormPage(data = this.data) {
    // Section h1.
    // New heading element.
    this.h1 = document.createElement("h1");
    this.h1.setAttribute("class", "h3 pb-3 edit-project__h1");

    // Create a form with values, or empty editable form
    if (!this.data.form && !this.data.form != "empty") {
      if (this.typeName == "Membership") {
        this.h1_name = document.createTextNode(`${this.data.username} `);
      } else {
        this.h1_name = document.createTextNode(`${this.data.name} `);
      }
      this.h1.appendChild(this.h1_name);

      this.separate_span = document.createElement("span");
      this.separate_span.setAttribute("class", "px-2");
      this.h1.appendChild(this.separate_span);
      const h1_separate_span = document.createTextNode(`|`);
      this.separate_span.appendChild(h1_separate_span);

      this.type_span = document.createElement("span");
      this.type_span.setAttribute("class", "text-gray text-normal");
      this.h1.appendChild(this.type_span);
      const h1_type = document.createTextNode(` ${this.typeName}`);
      this.type_span.appendChild(h1_type);

      this.id_span = document.createElement("span");
      this.id_span.setAttribute("class", "text-gray text-normal");
      this.h1.appendChild(this.id_span);
      const h1_id = document.createTextNode(` (ID ${this.data.id})`);
      this.id_span.appendChild(h1_id);

      // creating submit button before form so we can "disable" from form, but append it after form

      const submitNew = this._getSubmitDiv({ "id": this.data.id });

      // Add all elements to page
      this.typeFormDiv.appendChild(this.h1);
      const sectionForm = await this._getSectionForm(this.data);
      this.typeFormDiv.appendChild(sectionForm);

      // attribute section
      if (typeof this._hideAttributes !== "undefined" && this._hideAttributes == false) {
        this.typeFormDiv.appendChild(this._getAttributeSection());
      }

      // append save button
      this.typeFormDiv.appendChild(submitNew);

      // delete section
      this.typeFormDiv.appendChild(this.deleteTypeSection());

      return this.typeFormDiv;
    } else {
      const t = document.createTextNode(`Add new ${this.readableTypeName}.`);
      this.h1.appendChild(t);

      this.typeFormDiv.appendChild(this.h1);

      const submitNew = this._getSubmitNewDiv({ "id": this.data.id });

      const sectionForm = await this._getSectionForm(this._getEmptyData());
      this.typeFormDiv.appendChild(this.h1);
      this.typeFormDiv.appendChild(sectionForm);
      this.typeFormDiv.appendChild(submitNew);

      return this.typeFormDiv;
    }
  }

  _getSubmitNewDiv() {
    let text = document.createTextNode("Save");

    this.savePost.appendChild(text);
    this.savePost.setAttribute("value", "Save");
    this.savePost.setAttribute("class", `btn btn-clear text-center f1 text-semibold`);
    this.savePost.style.margin = "0 auto";
    this.savePost.addEventListener("click", this._savePost.bind(this));

    return this.savePost;
  }

  _savePost() {
    this.loading.showSpinner();
    let addNew = new TypeNew({
      "type": this.typeName,
      "projectId": this.projectId
    });

    let formData = this._getFormData();

    addNew.saveFetch(formData).then(([data, status]) => {
      this.loading.hideSpinner();
      console.log(status);
      if (status == 201 || status == 200) {
        // Hide the add new form
        this.sideNav.hide(`itemDivId-${this.typeName}-New`);
        // console.log("Resetting new form after save....");
        this.reset();

        // Create and show the container with new type
        this.sideNav.addItemContainer({
          "type": this.typeName,
          "id": data.id,
          "hidden": false
        });

        let form = document.createElement(this._getTypeClass());

        this.sideNav.fillContainer({
          "type": this.typeName,
          "id": data.id,
          "itemContents": form
        });

        const saveMessage = data.message;
        const saveReturnId = data.id;
        form.typeId = saveReturnId;

        // init form with the data
        this._fetchByIdPromise({id : saveReturnId}).then(resp => resp.json()).then( data=> {
          console.log(data);
          form._init({
            data,
            modal: this.modal,
            sidenav: this.sideNav,
            mediaListHandler: this.mediaListHandler,
            versionListHandler: this.versionListHandler,
            clusterListHandler: this.clusterListHandler,
            isStaff: this.isStaff
          });

          // Add the item to navigation
          console.log(data)
          this._updateNavEvent("new", data.name, saveReturnId);
        });
        // Let user know everything's all set!
        return this._modalSuccess(saveMessage);

      } else {
        return this._modalError(data.message);
      }


    }).catch((err) => {
      console.error(err);
      this.loading.hideSpinner();
      return this._modalError("Error adding new type.");
    });
  }

  _getTypeClass() {
    switch (this.typeName) {
      case "MediaType":
        return "media-type-main-edit";
      case "LocalizationType":
        return "localization-edit";
      case "LeafType":
        return "leaf-type-edit";
      case "StateType":
        return "state-type-edit";
      case "Project":
        return "project-main-edit";
      case "Membership":
        return "membership-edit";
      case "Version":
        return "versions-edit";
      case "Algorithm":
        return "algorithm-edit";
      default:
        break;
    }
  }

  //
  _getSubmitDiv({ id = -1 } = {}) {
    const submitDiv = document.createElement("div");
    submitDiv.setAttribute("class", "d-flex flex-items-center flex-justify-center py-3");

    // Save button and reset link
    submitDiv.appendChild(this._saveEntityButton(id));
    submitDiv.appendChild(this._resetEntityLink(id));

    return submitDiv;
  }

  _getAttributeSection() {
    this.attributeSection = document.createElement("attributes-main");
    this.attributeSection.setAttribute("data-from-id", `${this.typeId}`)
    this.attributeSection._init(this.typeName, this.typeId, this.data.name, this.projectId, this.data.attribute_types, this.modal);

    // Register the update event - If attribute list name changes, or it is to be added/deleted listeners refresh data
    this.attributeSection.addEventListener('settings-refresh', this._attRefreshListener.bind(this));

    return this.attributeSection;
  }

  _attRefreshListener(e) {
    return this.resetHard();
  }

  _saveEntityButton(id) {
    this.saveButton.setAttribute("type", "submit");
    this.saveButton.setAttribute("value", "Save");
    this.saveButton.setAttribute("class", `btn btn-clear f1 text-semibold`);


    if (!this.saveButton.disabled) {
      this.saveButton.addEventListener("click", (event) => {
        event.preventDefault();
        if (this.isChanged() || (this.attributeSection && this.attributeSection.hasChanges)) {
          // console.log("Save for id: " + id);
          this._save({ "id": id })
        } else {
          // @TODO- UX Save button disabled until form change
          let happyMsg = "Nothing new to save!";
          this._modalSuccess(happyMsg);
        }
      });
    }

    return this.saveButton;
  }

  _resetEntityLink(id) {
    this.resetLink = document.createElement("a");
    this.resetLink.setAttribute("href", "#");
    this.resetLink.setAttribute("class", `px-5 f1 text-gray hover-text-white`);

    let resetLinkText = document.createTextNode("Reset");
    this.resetLink.appendChild( resetLinkText );

    // Form reset event
    this.resetLink.addEventListener("click", (event) => {
      event.preventDefault();
      this.reset(id)
      console.log("Reset complete.");
    });
    return this.resetLink;
  }

  // form with parts put together
  _setForm() {
    this._form = document.createElement("form");
    this._form.id = this.typeId;

    //this._form.addEventListener("change", this._formChanged.bind(this));

    return this._form;
  }

  _getHeading() {
    let headingSpan = document.createElement("span");
    let labelSpan = document.createElement("span");
    labelSpan.setAttribute("class", "item-label");
    let t = document.createTextNode(`${this.readableTypeName}s`);
    labelSpan.appendChild(t);
    headingSpan.innerHTML = this.icon;
    headingSpan.appendChild(labelSpan);

    return headingSpan;
  }

  deleteTypeSection() {
    let button = document.createElement("button");
    button.setAttribute("class", "btn btn-small btn-charcoal float-right btn-outline text-gray");
    button.style.marginRight = "10px";

    let deleteText = document.createTextNode(`Delete`);
    button.appendChild(deleteText);

    let descriptionText = `Delete this ${this.readableTypeName} and all its data?`;
    let headingDiv = document.createElement("div");
    headingDiv.setAttribute("class", "clearfix py-6");

    let heading = document.createElement("div");
    heading.setAttribute("class", "py-md-5 float-left col-md-5 col-sm-5 text-right");

    heading.appendChild(button);

    let description = document.createElement("div");
    let _descriptionText = document.createTextNode("");
    _descriptionText.nodeValue = descriptionText;
    description.setAttribute("class", "py-md-6 f1 text-gray float-left col-md-7 col-sm-7");
    description.appendChild(_descriptionText);

    headingDiv.appendChild(heading);
    headingDiv.appendChild(description);

    this.deleteBox = this.boxHelper.boxWrapDelete({
      "children": headingDiv
    });

    this.deleteBox.style.backgroundColor = "transparent";

    button.addEventListener("click", this._deleteTypeConfirm.bind(this))

    return this.deleteBox;
  }

  _deleteTypeConfirm() {
    let button = document.createElement("button");
    let confirmText = document.createTextNode("Confirm")
    button.appendChild(confirmText);
    button.setAttribute("class", "btn btn-clear f1 text-semibold btn-red")

    button.addEventListener("click", this._deleteType.bind(this));

    this._modalConfirm({
      "titleText": `Delete Confirmation`,
      "mainText": `Pressing confirm will delete this ${this.typeName} and all its data from your account. Do you want to continue?`,
      "buttonSave": button,
      "scroll": false
    });
  }

  _deleteType() {
    this._modalCloseCallback();
    this.loading.showSpinner();
    let deleteType = new TypeDelete({
      "type": this.typeName,
      "typeId": this.typeId
    });

    if (this.typeId != "undefined") {
      deleteType.deleteFetch().then((data) => {
        this._updateNavEvent("remove");
        this.loading.hideSpinner();
        return this._modalComplete(data.message);
      }).catch((err) => {
        console.error(err);
        this.loading.hideSpinner();
        return this._modalError("Error with delete.");
      });
    } else {
      console.error("Type Id is not defined.");
      this.loading.hideSpinner();
      return this._modalError("Error with delete.");
    }

  }

  _getEmptyData() {
    return {
      id: `New`,
      name: "",
      project: this.projectId,
      description: "",
      visible: false,
      grouping_default: false,
      media: [],
      dtype: "",
      colorMap: null,
      interpolation: "none",
      association: "Media",
      line_width: 2,
      delete_child_localizations: false,
      cluster: null,
      manifest: null,
      files_per_job: null,
      parameters: [],
      categories: "",
      form: "empty"
    };
  }


  // FETCH FROM MODEL PROMISE STRUCTURE
  // GET ALL {typeName}
  _fetchGetPromise({ id = this.projectId } = {}) {
    return fetch(`/rest/${this.typeName}s/${id}`, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
  }

  // GET {typeName} {ID}
  _fetchByIdPromise({ id = this.typeId } = {}) {
    return fetch(`/rest/${this.typeName}/${id}`, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
  }

  // PATCH
  _fetchPatchPromise({ id = -1, formData } = {}) {
    return fetch(`/rest/${this.typeName}/${id}`, {
      method: "PATCH",
      mode: "cors",
      credentials: "include",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });
  }



  async _save({ id = -1, globalAttribute = false } = {}) {
    // @TODO add back inline error messaging
    // If any fields still have errors don't submit the form.
    // const errorList = this._shadow.querySelectorAll(`.errored`);
    // if(errorList && errorList.length > 0) return this._modalError("Please fix form errors.");;

    // Start spinner & Get promises list
    // console.log("Settings _save method for id: " + id);
    this.loading.showSpinner();

    let promises = []
    let errors = 0; // @TODO

    this._nameEdit = {
      edited: false,
      newName: "",
      typeName: this.typeName,
      typeId: this.typeId
    }

    // Main type form
    if (this.isChanged()) {
      // console.log("Main form was changed");
      const formData = this._getFormData();
      if (Object.entries(formData).length === 0) {
        return console.error("No formData");
      } else {
        let patchPromise = await this._fetchPatchPromise({ id, formData });
        promises.push(patchPromise);
        if (typeof formData.name !== "undefined") {
          this._nameEdit.edited = true;
          this._nameEdit.newName = formData.name;
        }
      }
    }

    let hasAttributeChanges = this.attributeSection && this.attributeSection.hasChanges ? true : false;
    const attrPromises = {
      promises: [],
      attrNamesNew: [],
      attrNames: []
    };

    if (hasAttributeChanges) {
      const attrFormsChanged = this.attributeSection.attrForms.filter(form => form._changed);
      if (attrFormsChanged && attrFormsChanged.length > 0) {

        for (let form of attrFormsChanged) {
          let promiseInfo = await form._getPromise({ id, entityType: this.typeName });
          attrPromises.promises.push(promiseInfo.promise);
          attrPromises.attrNamesNew.push(promiseInfo.newName);
          attrPromises.attrNames.push(promiseInfo.oldName);
        }

        if (attrPromises.promises.length > 0) {
          promises = [...promises, ...attrPromises.promises];
        }
      }
    }

    let messageObj = {};
    if (promises.length > 0 && errors === 0) {
      // Check if anything changed
      Promise.all(promises).then(async (respArray) => {
        let responses = [];
        respArray.forEach((item, i) => {
          responses.push(item.json())
        });

        Promise.all(responses)
          .then(dataArray => {
            messageObj = this._handleResponseWithAttributes({
              id,
              dataArray,
              hasAttributeChanges,
              attrPromises,
              respArray
            });

            let message = "";
            let success = false;
            let error = false;
            if (messageObj.messageSuccess) {
              let heading = `<div class=" pt-4 h3 pt-4">Success</div>`;
              message += heading + messageObj.messageSuccess;
              success = true;
            }
            if (messageObj.messageError) {
              let heading = `<div class=" pt-4 h3 pt-4">Error</div>`;
              message += heading + messageObj.messageError;
              error = true;
            }

            if (messageObj.requiresConfirmation) {
              let buttonSave = this._getAttrGlobalTrigger(id);
              let confirmHeading = `<div class=" pt-4 h3 pt-4">Global Change(s) Found</div>`
              let subText = `<div class="f1 py-2">Confirm to update across all types. Uncheck and confirm, or cancel to discard.</div>`

              let mainText = `${message}${confirmHeading}${subText}${messageObj.messageConfirm}`;
              this.loading.hideSpinner();
              this._modalConfirm({
                "titleText": "Complete",
                mainText,
                buttonSave
              });
            } else {
              let mainText = `${message}`;
              this.loading.hideSpinner();
              this._modalComplete(
                mainText
              );
              // Reset forms to the saved data from model
              this.resetHard();
            }
          }).then(() => {
            // Reset changed flag
            this.changed = false;

            if (hasAttributeChanges) {
              const attrFormsChanged = this.attributeSection.attrForms.filter(form => form._changed);
              if (attrFormsChanged.length > 0) {
                for (let f of attrFormsChanged) {
                  f.changeReset();
                }
              }
            }

            // Update related items with an event if required
            if (this._nameEdit.edited) {
              this._updateNavEvent("rename", this._nameEdit.newName)
            }

          });

      }).catch(err => {
        console.error("File " + err.fileName + " Line " + err.lineNumber + "\n" + err);
        this.loading.hideSpinner();
      });
    } else if (!promises.length > 0) {
      this.loading.hideSpinner();
      console.error("Attempted to save but no promises found.");
      return this._modalSuccess("Nothing new to save!");
    } else if (!errors === 0) {
      this.loading.hideSpinner();
      return this._modalError("Please fix form errors.");
    } else {
      this.loading.hideSpinner();
      return this._modalError("Problem saving form data.");
    }
  }

  /**
   * @param {boolean} val
   */
  set changed(val) {
    // console.log(`Changed val set to ${val}`);
    return this._changed = val;
  }

  isChanged() {
    // console.log(`Checking is this._changed.... ${this._changed}`);
    return this._changed;
  }

  _formChanged(event) {
    // console.log(`Changed: ${event.target.tagName}`);
    return this.changed = true;
  }

  _handleResponseWithAttributes({
    id = -1,
    dataArray = [],
    hasAttributeChanges = false,
    attrPromises = [],
    respArray = [] }
    = {}) {

    let messageSuccess = "";
    let messageError = "";
    let messageConfirm = "";
    let requiresConfirmation = false;

    respArray.forEach((item, i) => {
      let currentMessage = dataArray[i].message;
      let succussIcon = document.createElement("modal-success");
      let iconWrap = document.createElement("span");
      let warningIcon = document.createElement("modal-warning");
      let index = (hasAttributeChanges && respArray[0].url.indexOf("Attribute") > 0) ? i : i - 1;
      let formReadable = hasAttributeChanges ? attrPromises.attrNames[index] : "";
      let formReadable2 = hasAttributeChanges ? attrPromises.attrNamesNew[index] : "";

      if (item.status == 200) {
        //console.log("Return Message - It's a 200 response.");
        iconWrap.appendChild(succussIcon);
        messageSuccess += `<div class="py-2">${iconWrap.innerHTML} <span class="v-align-top">${currentMessage}</span></div>`;
      } else if (item.status != 200) {
        if (!hasAttributeChanges) {
          iconWrap.appendChild(warningIcon);
          //console.log("Return Message - It's a 400 response for main form.");
          messageError += `<div class="py-2">${iconWrap.innerHTML} <span class="v-align-top">${currentMessage}</span></div>`;
        } else if (hasAttributeChanges && currentMessage.indexOf("without the global flag set") > 0 && currentMessage.indexOf("ValidationError") < 0) {
          //console.log("Return Message - It's a 400 response for attr form.");
          let input = `<input type="checkbox" checked name="global" data-old-name="${formReadable}" class="checkbox"/>`;
          let newName = formReadable == formReadable2 ? "" : ` new name "${formReadable2}"`
          messageConfirm += `<div class="py-2">${input} Attribute "${formReadable}" ${newName}</div>`
          requiresConfirmation = true;
        } else {
          iconWrap.appendChild(warningIcon);
          messageError += `<div class="py-4">${iconWrap.innerHTML} <span class="v-align-top">Changes editing ${formReadable} not saved.</span></div>`
          messageError += `<div class="f1">Error: ${currentMessage}</div>`
        }
      }
    });

    return { requiresConfirmation, messageSuccess, messageConfirm, messageError };
  }

  _getAttrGlobalTrigger(id) {
    let buttonSave = document.createElement("button")
    buttonSave.setAttribute("class", "btn btn-clear f1 text-semibold");
    buttonSave.innerHTML = "Confirm";

    buttonSave.addEventListener("click", (e) => {
      e.preventDefault();
      let confirmCheckboxes = this.modal._shadow.querySelectorAll('[name="global"]');
      this._modalCloseCallback();

      for (let check of confirmCheckboxes) {
        //add and changed flag back to this one
        let name = check.dataset.oldName;
        let formId = `${name.replace(/[^\w]|_/g, "").toLowerCase()}_${id}`;

        if (check.checked == true) {
          // console.log("User marked as global: " + name);
          for (let form of this.attributeSection.attrForms) {
            if (form.id == formId) {
              // add back changed flag
              form.changed = true;
              form.global = true;
              // console.log("set data set global to true");
            }
          }
        } else {
          // console.log("User marked NOT global, do not resend: " + name);
        }
      }

      //run the _save method again with global true
      this._save({ "id": id, "globalAttribute": true })
    });

    return buttonSave;
  }

  _toggleChevron(e) {
    var el = e.target;
    return el.classList.toggle('chevron-trigger-90');
  }

  _toggleAttributes(e) {
    let el = e.target.parentNode.nextSibling;
    let hidden = el.hidden

    return el.hidden = !hidden;
  };

  // RESET FUNCTIONS
  reset(data = this.data) {
    this.typeFormDiv.innerHTML = "";
    return this.setupFormPage(data);
  }

  async resetHard() {
    console.log("Hard reset...");
    this.loading.showSpinner();
    //Utilities.warningAlert("Refreshing data", "#fff", false);
    //const response = await this._fetchGetPromise();
    const response = await this._fetchByIdPromise();
    // const data = await response.json();
    // this.data = this._findDataById(data);
    //Utilities.hideAlert();
    this.data = await response.json();
    this.loading.hideSpinner();

    this.reset(this.data);

    // console.log(this.data);

    // Update media list in the background
    // In future could send individual media update if fn there to receive it
    if (this.typeName == "MediaType") {
      this.mediaListHandler._clear();
      this.mediaListHandler._setProjectMediaList("", true);
    }
    if (this.typeName == "Version") {
      this.versionListHandler._clear();
      this.versionListHandler._setVersionList("", true);
    }
  }

  _findDataById(allData) {
    for (let x of allData) {
      if (x.id == this.typeId) return x;
    }
    return false;
  }

  // MODAL
  _modalSuccess(message) {
    this._modalClear();
    let text = document.createTextNode(" Success");
    this.modal._titleDiv.innerHTML = "";
    this.modal._titleDiv.append(document.createElement("modal-success"));
    this.modal._titleDiv.append(text);
    this.modal._main.innerHTML = message;
    //this.modal._main.classList.add("fixed-height-scroll");

    return this.modal.setAttribute("is-open", "true")
  }

  _modalError(message) {
    this._modalClear();
    let text = document.createTextNode(" Error");
    this.modal._titleDiv.innerHTML = "";
    this.modal._titleDiv.append(document.createElement("modal-warning"));
    this.modal._titleDiv.append(text);
    this.modal._main.innerHTML = message;
    return this.modal.setAttribute("is-open", "true")
  }

  _modalConfirm({
    titleText = "",
    mainText = "",
    buttonSave = document.createElement("button"),
    scroll = true
  } = {}) {
    this._modalClear();
    this.modal._titleDiv.innerHTML = titleText;

    if (mainText.nodeType == Node.ELEMENT_NODE) {
      this.modal._main.appendChild(mainText);
    } else {
      this.modal._main.innerHTML = mainText;
    }

    if (scroll) this.modal._main.classList.add("fixed-height-scroll");

    let buttonClose = document.createElement("button")
    buttonClose.setAttribute("class", "btn btn-clear f1 text-semibold btn-charcoal");
    buttonClose.innerHTML = "Cancel";

    buttonClose.addEventListener("click", this.modal._closeCallback);

    this.modal._footer.appendChild(buttonSave);
    this.modal._footer.appendChild(buttonClose);
    return this.modal.setAttribute("is-open", "true");
  }

  _modalComplete(message) {
    this._modalClear();
    let text = document.createTextNode("Complete");
    this.modal._titleDiv.innerHTML = "";
    this.modal._titleDiv.append(text);
    this.modal._main.innerHTML = message;
    this.modal._footer.innerHTML = "";
    this.modal._main.classList.remove("fixed-height-scroll");

    return this.modal.setAttribute("is-open", "true");
  }

  _modalClear() {
    this.modal._titleDiv.innerHTML = "";
    this.modal._main.innerHTML = "";
    this.modal._footer.innerHTML = "";

    return this.modal;
  }

  _modalCloseCallback() {
    return this.modal._closeCallback();
  }

  // Update the navigation
  _updateNavEvent(whatChanged, newName = "", newId = -1) {
    if (whatChanged == "remove") {
      let event = this.sideNav.removeItemEvent(this.typeId, this.typeName);
      this.sideNav.dispatchEvent(event);


      // If this item is a MEDIA or VERSION
      // Then remove the related media list inputs
      if (this.typeName == "MediaType") {
        const deleteEvt = new CustomEvent("change", { detail: { changed: "remove", typeId: this.typeId } });
        this.mediaListHandler.el.dispatchEvent(deleteEvt);
      } else if (this.typeName == "Version") {
        const deleteEvt = new CustomEvent("change", { detail: { changed: "remove", typeId: this.typeId } });
        this.versionListHandler.el.dispatchEvent(deleteEvt);
      }

    } else if (whatChanged == "rename") {
      // console.log("Rename event");

      // Renames the item in the side navigation
      let event = this.sideNav.renameItemEvent(this.typeId, this.typeName, newName);
      this.sideNav.dispatchEvent(event);

      // If this item is a MEDIA or VERSION
      // Then update the related media list inputs
      if (this.typeName == "MediaType") {
        const renameEvt = new CustomEvent("change", { detail: { changed: "rename", typeId: this.typeId, newName } });
        this.mediaListHandler.el.dispatchEvent(renameEvt);
      } else if (this.typeName == "Version") {
        const renameEvt = new CustomEvent("change", { detail: { changed: "rename", typeId: this.typeId, newName } });
        this.versionListHandler.el.dispatchEvent(renameEvt);
      }

    } else if (whatChanged == "new") {
      let event = this.sideNav.newItemEvent(newId, this.typeName, newName);
      this.sideNav.dispatchEvent(event);

      // If this item is a MEDIA or VERSION
      // Then update the related media list inputs
      if (this.typeName == "MediaType") {
        const evt = new CustomEvent("change", { detail: { changed: "new", typeId: this.typeId, newName } });
        this.mediaListHandler.el.dispatchEvent(evt);
      } else if (this.typeName == "Version") {
        const evt = new CustomEvent("change", { detail: { changed: "new", typeId: this.typeId, newName } });
        this.versionListHandler.el.dispatchEvent(evt);
      }
    } else {
      // console.log("Need more information to update the sidenav.");
    }
  }

  updateMediaList(detail) {
    //Look for the input and remove specific checkbox, or rename the label
    if (typeof this._mediaCheckboxes !== "undefined") {
      if (detail.changed == "rename") {
        this._mediaCheckboxes.relabelInput({
          value: detail.typeId,
          newLabel: detail.newName
        });
      } else if (detail.changed == "remove") {
        this._mediaCheckboxes.removeInput({
          value: detail.typeId
        });
      } else if (detail.changed == "new") {
        let item = {
          id: detail.typeId,
          name: detail.newName
        };
        
        this._mediaCheckboxes._newInput(item);
      }

    }
  }

  updateVersionList(detail) {
    //Look for the input and remove specific checkbox, or rename the label
    if (typeof this._basesCheckbox !== "undefined") {
      if (detail.changed == "rename") {
        // console.log("Heard rename")
        this._basesCheckbox.relabelInput({
          value: detail.typeId,
          newLabel: detail.newName
        });
      } else if (detail.changed == "remove") {
        this._basesCheckbox.removeInput({
          value: detail.typeId
        });
      } else if (detail.changed == "new") {
        let item = {
          id: detail.typeId,
          name: detail.newName
        };

        this._basesCheckbox._newInput(item);
      }

    }
  }

}

customElements.define("type-form", TypeForm);

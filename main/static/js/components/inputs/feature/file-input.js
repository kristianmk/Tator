class FileInput extends TatorElement {
  constructor() {
    super();

    const div = document.createElement("div");
    div.setAttribute("class", "d-flex flex-justify-between flex-items-center py-2 position-relative");
    this._shadow.appendChild(div);

    this._name = document.createTextNode("");
    div.appendChild(this._name);

    this.styleSpan = document.createElement("span");
    this.styleSpan.setAttribute("class", "px-1 d-flex flex-items-center col-8");
    div.appendChild(this.styleSpan);

    // This input is URL to send to an endpoint
    this._nameInput = document.createElement("text-input");

    // This input is URL to send to an endpoint
    this._hiddenInput = document.createElement("text-input");
    this._hiddenInput.setAttribute("class", "col-12");
    this._hiddenInput._input.setAttribute("class", "form-control input-sm col-12");
    this._hiddenInput.setAttribute("type", "text");
    this._hiddenInput.permission = null;
    this.styleSpan.appendChild(this._hiddenInput);

    // Edit button
    this.editButton = document.createElement("label");
    this.editButton.append(document.createTextNode("Choose File"));
    this.editButton.style.width = "200px";
    this.editButton.setAttribute("class", `btn btn-clear btn-charcoal btn-small mx-3`);
    this.styleSpan.append(this.editButton);

    // Input is tied to the Edit button with "for" attribute
    // This input hits S3 to get a url for the hidden input
    this._editInput = document.createElement("input");
    this._editInput.setAttribute("class", "form-control input-sm col-1");
    this._editInput.setAttribute("type", "file");
    this._editInput.style.position = "absolute"
    this._editInput.style.left = "-99999rem";
    this.styleSpan.appendChild(this._editInput);

    // Image upload visible, and hidden - Plus Custom warning area.
    this.uploadWarningRow = document.createElement("div");
    this.uploadWarningRow.setAttribute("class", "offset-md-3 offset-sm-4 col-md-9 col-sm-8 pb-3");
    this._editInput.appendChild(this.uploadWarningRow);

    // Validate file size / show warning
    this.validate = new TypeFormValidation(); // @TODO move validation in here
    const warning = new InlineWarning();
    this.uploadWarningRow.appendChild(warning.div());
    this._editInput.addEventListener("change", this._editListeners.bind(this));

    // this._input.addEventListener("focus", () => {
    //   document.body.classList.add("shortcuts-disabled");
    // });

    // this._input.addEventListener("blur", () => {
    //   document.body.classList.remove("shortcuts-disabled");
    // });

    this._editInput.addEventListener("input-invalid", (e) => {
      warning.show(e.detail.errorMsg);
      this._editInput.classList.add("invalid");
    });

    this._editInput.addEventListener("input-valid", (e) => {
      this._editInput.classList.remove("invalid");
      warning.hide();
    });

  }

  static get observedAttributes() {
    return ["name", "for", "type"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "name":
        this._name.nodeValue = newValue;
        break;
      case "for":
        //this._hiddenInput.setAttribute("name", newValue);
        this._editInput.id = `${newValue}_visible`;
        this._editInput.setAttribute("name", `${newValue}_visible`);
        this.editButton.setAttribute("for", `${newValue}_visible`);
        // this._previewImg.title = `Previewing image for ${newValue}`;
        break;
      case "type":
        if (newValue === "yaml") {
          this._validate = this.yamlValidate;
        }
    }
  }

  set permission(val) {
    if (hasPermission(val, "Can Edit")) {
      this._input.removeAttribute("readonly");
      this._input.classList.remove("disabled");
    } else {
      this._input.setAttribute("readonly", "");
      this._input.classList.add("disabled");
    }
  }

  set default(val) {
    this._default = val;
  }

  changed() {
    return this.getValue() !== this._default;
  }

  reset() {
    // Go back to default value
    if (typeof this._default !== "undefined") {
      this.setValue(this._default);
    } else {
      this.setValue("");
    }
  }

  getValue() {
    return this._hiddenInput.getValue();
  }

  setValue(val) {
    this._hiddenInput.setValue(val);
  }

  set projectId(val) {
    this._projectId = val;
  }

  //
  _editListeners(e) {
    this.dispatchEvent(new Event("change"));
    const file = e.target.files[0];
    let uploadData = {
      file,
      projectId: this._projectId,
      gid: "",
      section: "",
      mediaTypeId: null,
      username: "",
      token: getCookie("csrftoken"),
      isImage: true
    };

    // upload file and set input
    let uploader = new SingleUpload(uploadData);
    uploader.start().then((key) => {

      let hasError = this._validate(file);

      if (hasError) {
        let errorEvent = new CustomEvent("input-invalid", {
          "detail":
            { "errorMsg": hasError }
        });
        this._editInput.dispatchEvent(errorEvent);
      } else {
        console.log("Fetch download info")
        let bodyData = {
          keys: [
            key
          ]
        }

        fetch(`/rest/DownloadInfo/${this._projectId}`, {
          method: "POST",
          credentials: "same-origin",
          body: JSON.stringify(bodyData),
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
            "Accept": "application/json",
            "Content-Type": "application/json"
          }
        }).then((resp) => {
          return resp.json();
        }).then((data) => {
          // Check the related state types

          const bodyData = {
            name: data[0].key,
            upload_url: data[0].url
          }
          fetch(`/rest/SaveAlgorithmManifest/${this._projectId}`,
            {
              method: "POST",
              credentials: "same-origin",
              body: JSON.stringify(bodyData),
              headers: {
                "X-CSRFToken": getCookie("csrftoken"),
                "Accept": "application/json",
                "Content-Type": "application/json"
              }
            }
          ).then(resp => resp.json()).then(
            manifestData => {
              console.log(manifestData);
              this.setValue(manifestData.url);
              Utilities.showSuccessIcon(`Manifest file uploaded to: ${manifestData.url}`);
            }
          );

        });
      }
    });

  }

  _validate() {
    return null;
  }

  getFileName() {
    return this._nameInput.getValue();
  }

  yamlValidate(file) {
    var extension = String(file.name).substr(-4, 4);
    console.log(extension);

    return !(extension === "yaml" || extension === ".yml");
  }
}

customElements.define("file-input", FileInput);
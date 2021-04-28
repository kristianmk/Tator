class EntityAttrPanel extends TatorElement {
    constructor() {
      super();

      // Panel Container
      this._main = document.createElement("div");
      this._main.setAttribute("class", "entity-panel px-3");
      //this._main.hidden = true;
      this._shadow.appendChild(this._main);

      // Pin Actions
      // Pin then < to close the panel (keep open v1)
      // this.pinned = new EntityPanelPin({ panelContainer: this });
      // let actions = this.pinned.pinThisEl();
      // actions.setAttribute("class", "d-flex");
      // this._main.appendChild(actions);

      // Content id
      this._heading = document.createElement("h2");
      this._heading.setAttribute("class", "h2 py-3");
      this._main.appendChild(this._heading);

      // Panel Img Container
      this._imgContainer = document.createElement("div");
      this._imgContainer.setAttribute("class", "text-center");
      this._main.appendChild(this._imgContainer)

      // Panel Img
      this._img = document.createElement("img");
      this._imgContainer.appendChild(this._img);

      // Entity Data in Form ( @TODO Editable? or display only )

      const subAnnotationHeader = document.createElement("h3");
      subAnnotationHeader.setAttribute("class", "h3 py-3 text-gray");
      subAnnotationHeader.textContent = "Attributes";

      this._main.appendChild(subAnnotationHeader);
      this.entityData = document.createElement("entity-form-for-panel");
      this._main.appendChild(this.entityData);

      //
      const mediaDiv = document.createElement("div");
      mediaDiv.setAttribute("class", "py-3 text-gray col-12");
      this._main.appendChild(mediaDiv);

      this._mediaHeader = document.createElement("h3");
      this._mediaHeader.setAttribute("class", "h3 py-3");
      mediaDiv.appendChild(this._mediaHeader);

      this._mediaPanel = document.createElement("entity-form-for-panel");
      mediaDiv.appendChild(this._mediaPanel);

      // View media button link to annotation media
      const linksDiv = document.createElement("div");
      linksDiv.setAttribute("class", "annotation__panel-group px-4 py-3 text-gray f1 d-flex col-11");
      this._main.appendChild(linksDiv);

      const mediaLinkDiv = document.createElement("div");
      mediaLinkDiv.setAttribute("class", "d-flex flex-items-center py-1");
      linksDiv.appendChild(mediaLinkDiv);

      const mediaLinkLabel = document.createElement("label");
      mediaLinkLabel.textContent = "View Annotation In Media";
      mediaLinkDiv.appendChild(mediaLinkLabel);

      this._mediaLink = document.createElement("a");
      this._mediaLink.setAttribute("href", "#");
      //mediaLinkDiv.appendChild(this._mediaLink);
      const goToFrameButton = document.createElement("entity-frame-button");
      goToFrameButton.style.marginLeft = "16px";
      mediaLinkDiv.appendChild(goToFrameButton);

      // actions.appendChild(this.viewMedia);

      // // View submission
      // this.viewSubmission = document.createElement("button");
      // this.viewSubmission.setAttribute("class", "btn btn-charcoal col-6");
      // let vsText = document.createTextNode("View Submission");
      // this.viewSubmission.appendChild(vsText);
      // actions.appendChild(this.viewSubmission);

      this._mediaLink = "#";
      goToFrameButton.addEventListener("click", () => {
        window.location = this._mediaLink;
      });

    }

    init(annotationObject, panelContainer){
      // id,
      // metaDetails,
      // mediaLink,
      // graphic,
      // attributes,
      // created,
      // modified,
      // userName,
      // posText

      this._container = panelContainer;
      //this._heading.appendChild( document.createTextNode( `ID ${annotationObject.id}` ) )

      this._heading.textContent = `Annotation (ID: ${annotationObject.id})`;

      if(typeof annotationObject.graphic !== "undefined" && annotationObject.graphic !== null) {
        this.reader = new FileReader();
        this.reader.readAsDataURL(annotationObject.graphic); // converts the blob to base64
        this.reader.addEventListener("load", this._setImgSrc.bind(this));
      } else {
        this._img.setAttribute("src", "/static/images/spinner-transparent.svg");
        this._img.hidden = false;
      }

      this._mediaLink = annotationObject.mediaLink;
      this.entityData._init(annotationObject);

    }

    /**
    * Set the card's main image thumbnail
    * @param {image} image
    */
    setImage(image) {
      this.reader = new FileReader();
      this.reader.readAsDataURL(image); // converts the blob to base64
      this.reader.addEventListener("load", this._setImgSrc.bind(this));
    }

    _setImgSrc () {
      this._img.setAttribute("src", this.reader.result);
      this._img.hidden = false;
    }

    /**
     * @param {entityObject} media
     */
    setMedia(media) {
      this._mediaPanel._init(media);
      this._mediaHeader.textContent = `Associated Media Attributes (ID: ${media.id})`;
    }

  }

  customElements.define("entity-attributes-panel", EntityAttrPanel);
class OrganizationSettings extends TatorPage {
  constructor() {
    super();

    // loading spinner
    this.loading = new LoadingSpinner();
    this._shadow.appendChild( this.loading.getImg());
    this.loading.showSpinner();

    // header
    const header = document.createElement("div");
    this._headerDiv = this._header._shadow.querySelector("header");
    header.setAttribute("class", "annotation__header d-flex flex-items-center flex-justify-between px-2 f3");
    const user = this._header._shadow.querySelector("header-user");
    user.parentNode.insertBefore(header, user);

    const div = document.createElement("div");
    div.setAttribute("class", "d-flex flex-items-center");
    header.appendChild(div);

    // main element
    this.main = document.createElement("main");
    this.main.setAttribute("class", "position-relative");
    this._shadow.appendChild(this.main);

    // Navigation panels main for item settings.
    this.settingsNav =  document.createElement("settings-nav");
    this.main.appendChild( this.settingsNav );

    // Web Components for this page
    this.settingsViewClasses = [  "affiliation-edit",
                                  "bucket-edit",
                                  "job-cluster-edit",
                               ];
    
    // Modal parent - to pass to page components
    this.modal = document.createElement("modal-dialog");
    this._shadow.appendChild( this.modal );
    this.modal.addEventListener("open", this.showDimmer.bind(this));
    this.modal.addEventListener("close", this.hideDimmer.bind(this));

    // Error catch all
    window.addEventListener("error", (evt) => {
      //
    });

  }

  /* Get personlized information when we have project-id, and fill page. */
  static get observedAttributes() {
    return ["organization-id"].concat(TatorPage.observedAttributes);
  }
  attributeChangedCallback(name, oldValue, newValue) {
    TatorPage.prototype.attributeChangedCallback.call(this, name, oldValue, newValue);
    switch (name) {
      case "organization-id":
        this._init();
        break;
    }
  }

  /* 
   * Run when organization-id is set to run fetch the page content. 
   */
  _init() {
    // Organization data
    this.organizationId = this.getAttribute("organization-id");
    this.organizationData = new OrganizationData(this.organizationId);
    this.organizationEdit = new OrganizationMainEdit();
    const organizationPromise = this.organizationData.getOrganization();

    organizationPromise
    .then(data => {
      const formView = this.organizationEdit;

      this.loading.hideSpinner();
      this.makeContainer({
        objData: data, 
        classBase: formView,
        hidden : false
      });

      // Fill it with contents
      this.settingsNav.fillContainer({
        type : formView.typeName,
        id : data.id,
        itemContents : formView
      });

      // init form with the data
      formView._init({ 
        data: data, 
        modal : this.modal, 
        sidenav : this.settingsNav
      });

      // Add nav to that container
      this.settingsNav._addSimpleNav({
        name : formView._getHeading(),
        type : formView.typeName ,
        id : data.id,
        selected : true
      });
       
      /* 
      for(let i in this.settingsViewClasses){
        // Add a navigation section
        // let data =  dataArray[i] ;
        let tc = this.settingsViewClasses[i];
        let typeClassView = document.createElement(tc);

        // Data for a subitem that is an empty row
        // an empty row in each TYPE
        let emptyData = typeClassView._getEmptyData();
        emptyData.name = "+ Add new";
        emptyData.project = this.projectId;

        // Add empty form container for + New
        this.makeContainer({
          data : emptyData, 
          classBase: typeClassView
        });

        // Add navs
        const headingEl = this.settingsNav._addNav({
          name : typeClassView._getHeading(),
          type : typeClassView.typeName, 
          subItems : [ emptyData ]
        });

        // Add add new containers
        typeClassView.init(this.organizationData);

        this.settingsNav.fillContainer({
          type : typeClassView.typeName,
          id : emptyData.id,
          itemContents : typeClassView
        });

        // init the form with the data
        typeClassView._init({ 
          data : emptyData, 
          modal : this.modal, 
          sidenav : this.settingsNav,
        });

        headingEl.addEventListener("click", () => {
          // provide the class
          this._sectionInit({ viewClass : tc })
        }, { once: true }); // just run this once
      }
      */
    });
  }

  /* Run when project-id is set to run fetch the page content. */
  _sectionInit( {viewClass} ) {
    const formView = document.createElement( viewClass );
    console.log(viewClass);

    formView._fetchGetPromise({"id": this.projectId} )
    .then( (data) => {
      return data.json();
    }).then( (objData) => {
      this.loading.hideSpinner();

      // Pass in data interface to memberships.
      if (formView.typeName == "Membership") {
        this.membershipData = new MembershipData(this.projectId);
        formView.init(this.membershipData);
      }

      // Make media new list before we add an empty row
      if(formView.typeName == "MediaType"){
        // const mediaList = new DataMediaList( this.projectId );
        this._dataMediaList._setProjectMediaList(objData, true);
      }

      // Make versions new list before we add an empty row
      if(formView.typeName == "Version"){
        // Versions number sort
        if (typeof objData[0] !== "undefined" && typeof objData[0].number !== "undefined") {
          objData = objData.sort((a, b) => a.number > b.number);
        }
        // const versionsList = new DataVersionList( this.projectId );
        this._dataVersionList._setVersionList(objData, true);
      }

      // Add item containers for Types
      this.makeContainers({
        objData, 
        classBase: formView
      });

      // Add navs
      this.settingsNav._addNav({
        type : formView.typeName, 
        subItems : objData,
        subItemsOnly : true
      });

      // Add contents for each Entity
      for(let g of objData){
        let form = document.createElement(viewClass);
        if (form.typeName == "Membership") {
          form.init(this.membershipData);
        }
        this.settingsNav.fillContainer({
          type : form.typeName,
          id : g.id,
          itemContents : form
        });

        // List to relevant data handlers to show the correct list options
        const usesMediaList = ["StateType", "LocalizationType"];
        if (usesMediaList.includes(form.typeName)) {
          this._dataMediaList.el.addEventListener("change", (e) => {
            console.log(e.detail);
            form.updateMediaList(e.detail);
          });
        } else if(form.typeName == "Version") {
          this._dataVersionList.el.addEventListener("change", (e) => {
            console.log(e.detail);
            form.updateVersionList(e.detail);
          });
        }

        // init form with the data
        form._init({ 
          data : g, 
          modal : this.modal, 
          sidenav: this.settingsNav,
          versionListHandler: this._dataVersionList,
          mediaListHandler: this._dataMediaList
        });
      }
          
    });
  }

  makeContainer({objData = {}, classBase, hidden = true}){
    // Adds item panels for each view
    this.settingsNav.addItemContainer({
      type : classBase.typeName,
      id : objData.id,
      hidden
    });
  }
  
  makeContainers({objData = {}, classBase, hidden = true}){
     for(let data of objData){
      this.makeContainer({objData : data, classBase, hidden});
    }
  }

  // Modal for this page, and handlers
  showDimmer(){
    return this.setAttribute("has-open-modal", "");
  }

  hideDimmer(){
    return this.removeAttribute("has-open-modal");
  }

}

customElements.define("organization-settings", OrganizationSettings);

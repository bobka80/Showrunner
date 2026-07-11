//-----------------------------------------------------------------------
// <copyright file="QueryParametersUserControl.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Views
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel;    
    using System.Data;
    using System.Drawing;
    using System.Linq;
    using System.Text;
    using System.Windows.Forms;

    using ViewModels;

    /// <summary>
    /// View to edit IQueryParameters
    /// </summary>
    public partial class QueryParametersUserControl 
        : UserControl
    {
        /// <summary>
        /// View model to edit IQueryParameters
        /// </summary>
        private QueryParametersViewModel viewModel;

        /// <summary>
        /// Initializes a new instance of the QueryParametersUserControl class
        /// </summary>
        public QueryParametersUserControl()
        {
            this.InitializeComponent();

            this.viewModel = ViewModelLocator.ViewModel<QueryParametersViewModel>();

            // null for design mode as the ServiceProvider is not initialized
            if (this.viewModel != null)
            {
                // query parameters
                this.querySelectComboBox.BindEnumeration(this.viewModel, "QuerySelect", this.viewModel.QuerySelects);
                this.querySessionComboBox.BindEnumeration(this.viewModel, "QuerySession", this.viewModel.QuerySessions);
                this.queryTargetComboBox.BindEnumeration(this.viewModel, "QueryTarget", this.viewModel.QueryTargets);
            }
        }
    }
}

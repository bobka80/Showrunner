//-----------------------------------------------------------------------
// <copyright file="ResponseParametersUserControl.cs" company="Technology Solutions UK Ltd"> 
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
    /// User control to edit IResponseParameters
    /// </summary>
    public partial class ResponseParametersUserControl
        : UserControl
    {
        /// <summary>
        /// View model for the response parameters
        /// </summary>
        private ResponseParametersViewModel viewModel;

        /// <summary>
        /// Initializes a new instance of the ResponseParametersUserControl class
        /// </summary>
        public ResponseParametersUserControl()
        {
            this.InitializeComponent();

            this.viewModel = ViewModelLocator.ViewModel<ResponseParametersViewModel>();

            // null for design mode as the ServiceProvider is not initialized
            if (this.viewModel != null)
            {
                // IResponseParameters
                this.includeDateTimeCheckBox.BindCheckState(this.viewModel, "IncludeDateTime");
                this.useAlertCheckBox.BindCheckState(this.viewModel, "UseAlert");
            }
        }
    }
}

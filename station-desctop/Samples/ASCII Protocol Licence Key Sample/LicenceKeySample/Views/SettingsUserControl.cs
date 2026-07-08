//-----------------------------------------------------------------------
// <copyright file="SettingsUserControl.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2014 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Views
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Drawing;
    using System.Data;
    using System.Linq;
    using System.Text;
    using System.Windows.Forms;

    using ViewModels;

    /// <summary>
    /// User control to adjust the settings used for the licence key
    /// </summary>
    public partial class SettingsUserControl 
        : UserControl
    {
        /// <summary>
        /// The view model for this view
        /// </summary>
        private SettingsViewModel viewModel;

        /// <summary>
        /// Initializes a new instance of the SettingsUserControl class
        /// </summary>
        public SettingsUserControl()
        {
            this.InitializeComponent();

            this.viewModel = ViewModelLocator.ViewModel<SettingsViewModel>();

            if (this.viewModel != null)
            {
                this.applyButton.DataBindings.Add("Enabled", this.viewModel, "CanExecuteApplyChanges");
                this.companyTextBox.DataBindings.Add("Text", this.viewModel, "CompanyName");
                this.secretTextBox.DataBindings.Add("Text", this.viewModel, "Secret");                
            }
        }

        /// <summary>
        /// Apply the changes to the settings
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void ApplyButton_Click(object sender, EventArgs e)
        {
            this.viewModel.ExecuteApplyChanges();
        }
    }
}

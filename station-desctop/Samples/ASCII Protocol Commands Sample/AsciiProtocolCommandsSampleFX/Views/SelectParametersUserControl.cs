//-----------------------------------------------------------------------
// <copyright file="SelectParametersUserControl.cs" company="Technology Solutions UK Ltd"> 
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
    /// View to edit the ISelectParameters
    /// </summary>
    public partial class SelectParametersUserControl 
        : UserControl
    {
        /// <summary>
        /// View model for the select parameters
        /// </summary>
        private SelectParametersViewModel viewModel;

        /// <summary>
        /// Initializes a new instance of the SelectParametersUserControl class
        /// </summary>
        public SelectParametersUserControl()
        {
            this.InitializeComponent();

            this.viewModel = ViewModelLocator.ViewModel<SelectParametersViewModel>();

            // null for design mode as the ServiceProvider is not initialized
            if (this.viewModel != null)
            {
                this.selectActionComboBox.DataSource = this.viewModel.SelectActions;
                this.selectActionComboBox.DataBindings.Add("SelectedItem", this.viewModel, "SelectAction");
                this.selectBankComboBox.DataSource = this.viewModel.SelectDatabanks;
                this.selectBankComboBox.DataBindings.Add("SelectedItem", this.viewModel, "SelectBank");
                this.selectDataTextBox.DataBindings.Add("Text", this.viewModel, "SelectData");
                this.selectLengthTextBox.DataBindings.Add("Text", this.viewModel, "SelectLength");
                this.selectOffsetTextBox.DataBindings.Add("Text", this.viewModel, "SelectOffset");
                this.selectTargetComboBox.DataSource = this.viewModel.SelectTargets;
                this.selectTargetComboBox.DataBindings.Add("SelectedItem", this.viewModel, "SelectTarget");
                this.selectInventoryOnlyCheckBox.BindCheckState(this.viewModel, "InventoryOnly");
            }
        }
    }
}

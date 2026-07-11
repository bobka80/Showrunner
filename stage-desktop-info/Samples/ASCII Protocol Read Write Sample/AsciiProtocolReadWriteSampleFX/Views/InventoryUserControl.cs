//-----------------------------------------------------------------------
// <copyright file="InventoryUserControl.cs" company="Technology Solutions UK Ltd"> 
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

    using TechnologySolutions.ModelViewViewModel.Views;
    using TechnologySolutions.Rfid.AsciiProtocol;
    using ViewModels;

    /// <summary>
    /// User control to perform inventories
    /// </summary>
    public partial class InventoryUserControl 
        : UserControl
    {
        /// <summary>
        /// Container of bindings between ICommands and controls
        /// </summary>
        private List<CommandBinder> commandBindings;
        
        /// <summary>
        /// Implements the commands
        /// </summary>
        private InventoryViewModel viewModel;

        /// <summary>
        /// Initializes a new instance of the InventoryUserControl class
        /// </summary>
        public InventoryUserControl()
        {
            this.InitializeComponent();

            this.viewModel = ViewModelLocator.ViewModel<InventoryViewModel>();

            if (this.viewModel != null)
            {
                this.commandBindings = new List<CommandBinder>();                

                // Create a menu of session values
                this.querySessionComboBox.DataSource = Enum.GetValues(typeof(QuerySession));
                this.querySessionComboBox.DataBindings.Add("SelectedItem", this.viewModel, "Session");
                this.querySessionComboBox.FormattingEnabled = true;
                this.querySessionComboBox.Format += delegate(object sender, ListControlConvertEventArgs e)
                {
                    e.Value = ((QuerySession)e.Value).Description();
                };

                this.queryTargetComboBox.DataSource = Enum.GetValues(typeof(QueryTarget));
                this.queryTargetComboBox.DataBindings.Add("SelectedItem", this.viewModel, "Target");
                this.queryTargetComboBox.FormattingEnabled = true;
                this.queryTargetComboBox.Format += delegate(object sender, ListControlConvertEventArgs e)
                {
                    e.Value = ((QueryTarget)e.Value).Description();
                };

                this.commandBindings.Add(new ButtonBinder(this.scanRfidAsyncButton, this.viewModel.InventoryAsynchronous));
                this.commandBindings.Add(new ButtonBinder(this.scanRfidButton, this.viewModel.InventorySynchronous));
            }
        }
    }
}

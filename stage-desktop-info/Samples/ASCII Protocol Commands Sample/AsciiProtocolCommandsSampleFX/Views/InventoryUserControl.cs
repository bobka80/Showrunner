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

            // null for design mode as the ServiceProvider is not initialized
            if (this.viewModel != null)
            {
                this.commandBindings = new List<CommandBinder>();

                this.fastIdentifierCheckBox.BindCheckState(this.viewModel, "IsFastIdentifierEnabled");
                this.tagFocusCheckBox.BindCheckState(this.viewModel, "IsTagFocusEnabled");
                this.commandBindings.Bind(this.scanRfidAsyncButton, this.viewModel.InventoryAsynchronous);
                this.commandBindings.Bind(this.scanRfidButton, this.viewModel.InventorySynchronous);
            }
        }
    }
}

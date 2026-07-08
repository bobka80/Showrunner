//-----------------------------------------------------------------------
// <copyright file="CommissionTransponderUserControl.cs" company="Technology Solutions UK Ltd"> 
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
    using ViewModels;

    /// <summary>
    /// Provides user interface to commission a transponder
    /// </summary>
    public partial class CommissionTransponderUserControl 
        : UserControl
    {
        /// <summary>
        /// Container for bindings between the user controls and the ICommands
        /// </summary>
        private List<CommandBinder> commandBindings;

        /// <summary>
        /// View model to perform the commission actions
        /// </summary>
        private CommissionTransponderViewModel viewModel;

        /// <summary>
        /// Initializes a new instance of the CommissionTransponderUserControl class
        /// </summary>
        public CommissionTransponderUserControl()
        {
            this.InitializeComponent();
            
            this.viewModel = ViewModelLocator.ViewModel<CommissionTransponderViewModel>();

            // null for design mode as the ServiceProvider is not initialized
            if (this.viewModel != null)
            {
                this.commandBindings = new List<CommandBinder>();

                this.currentEpcTextBox.DataBindings.Add("Text", this.viewModel, "CurrentEpc");
                this.requiredEpcTextBox.DataBindings.Add("Text", this.viewModel, "RequiredEpc");

                this.commandBindings.Bind(this.changeEpcButton, this.viewModel.ChangeEpcCommand);
            }
        }
    }
}

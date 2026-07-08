//-----------------------------------------------------------------------
// <copyright file="AutorunFileUserControl.cs" company="Technology Solutions UK Ltd"> 
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
    /// View to handle tasks relating to the Autorun file
    /// </summary>
    public partial class AutorunFileUserControl 
        : UserControl
    {
        /// <summary>
        /// View model that implements the functionality
        /// </summary>
        private AutorunFileViewModel viewModel;

        /// <summary>
        /// Bindings between the controls and the view model
        /// </summary>
        private List<CommandBinder> commandBindings;

        /// <summary>
        /// Initializes a new instance of the AutorunFileUserControl class
        /// </summary>
        public AutorunFileUserControl()
        {
            this.InitializeComponent();
            
            this.viewModel = ViewModelLocator.ViewModel<AutorunFileViewModel>();

            // null for design mode as the ServiceProvider is not initialized
            if (this.viewModel != null)
            {
                this.commandBindings = new List<CommandBinder>();

                this.commandTextBox.DataBindings.Add("Text", this.viewModel, "CommandLine");

                this.commandBindings.Bind(this.addCommandToAutorunFileButton, this.viewModel.AddCommandToAutorunFileCommand);
                this.commandBindings.Bind(this.readAutorunFileButton, this.viewModel.DownloadAutorunFileCommand);
                this.commandBindings.Bind(this.deleteAutorunFileButton, this.viewModel.DeleteAutorunFileCommand);
            }
        }
    }
}

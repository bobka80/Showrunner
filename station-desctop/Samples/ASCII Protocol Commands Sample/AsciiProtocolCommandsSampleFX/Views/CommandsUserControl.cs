//-----------------------------------------------------------------------
// <copyright file="CommandsUserControl.cs" company="Technology Solutions UK Ltd"> 
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
    /// User control to perform some general commands
    /// </summary>
    public partial class CommandsUserControl 
        : UserControl
    {
        /// <summary>
        /// Container for bindings between ICommand to controls
        /// </summary>
        private List<CommandBinder> commandBindings;

        /// <summary>
        /// View model to implement the commands
        /// </summary>
        private CommandsViewModel viewModel;

        /// <summary>
        /// Initializes a new instance of the CommandsUserControl class
        /// </summary>
        public CommandsUserControl()
        {
            this.InitializeComponent();
            
            this.viewModel = ViewModelLocator.ViewModel<CommandsViewModel>();

            // null for design mode as the ServiceProvider is not initialized
            if (this.viewModel != null)
            {
                this.commandBindings = new List<CommandBinder>();

                this.commandBindings.Bind(this.abortCommandButton, this.viewModel.AbortCommand);
                this.commandBindings.Bind(this.alertButton, this.viewModel.AlertCommand);
                this.commandBindings.Bind(this.batteryStatusButton, this.viewModel.BatteryStatusCommand);
                this.commandBindings.Bind(this.sleepButton, this.viewModel.SleepCommand);
                this.commandBindings.Bind(this.versionButton, this.viewModel.VersionCommand);
                this.commandBindings.Bind(this.executeAutorunButton, this.viewModel.ExecuteAutorunCommand);
            }
        }
    }
}

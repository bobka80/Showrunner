//-----------------------------------------------------------------------
// <copyright file="LogFileUserControl.cs" company="Technology Solutions UK Ltd"> 
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
    /// Provides the view to manipulate the log file
    /// </summary>
    public partial class LogFileUserControl 
        : UserControl
    {
        /// <summary>
        /// Container for bindings between commands and ICommands
        /// </summary>
        private List<CommandBinder> commandBindings;

        /// <summary>
        /// View model to implement the behaviour of the view
        /// </summary>
        private LogFileViewModel viewModel;

        /// <summary>
        /// Initializes a new instance of the LogFileUserControl class
        /// </summary>
        public LogFileUserControl()
        {
            this.InitializeComponent();

            this.viewModel = ViewModelLocator.ViewModel<LogFileViewModel>();

            // null for design mode as the ServiceProvider is not initialized
            if (this.viewModel != null)
            {
                this.commandBindings = new List<CommandBinder>();

                this.commandBindings.Bind(this.deleteLogbutton, this.viewModel.DeleteLogCommand);
                this.commandBindings.Bind(this.disableLoggingButton, this.viewModel.DisableLoggingCommand);
                this.commandBindings.Bind(this.downloadLogButton, this.viewModel.DownloadLogCommand);
                this.commandBindings.Bind(this.enableLoggingButton, this.viewModel.EnableLoggingCommand);
                this.commandBindings.Bind(this.readLoggingEnabledButton, this.viewModel.ReadLoggingEnabledCommand);
            }
        }
    }
}

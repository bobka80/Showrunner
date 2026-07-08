//-----------------------------------------------------------------------
// <copyright file="AutorunFileViewModel.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.ViewModels
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using Services;
    using TechnologySolutions.ModelViewViewModel.ViewModels;
    using TechnologySolutions.Rfid.AsciiProtocol;
    using TechnologySolutions.Rfid.AsciiProtocol.Commands;    

    /// <summary>
    /// View model to manipulate the Autorun file
    /// </summary>
    public class AutorunFileViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// Backing field for Command
        /// </summary>
        private string commandLine = string.Empty;

        /// <summary>
        /// To execute ASCII commands on the reader
        /// </summary>
        private ICommandService commander;

        /// <summary>
        /// To report messages to the user interface
        /// </summary>
        private IMessageService messages;

        /// <summary>
        /// Initializes a new instance of the AutorunFileViewModel class
        /// </summary>
        /// <param name="commander">To execute ASCII commands</param>
        /// <param name="messages">To report to the user interface</param>
        public AutorunFileViewModel(ICommandService commander, IMessageService messages)
        {
            if (commander == null)
            {
                throw new ArgumentNullException("commander");
            }

            if (messages == null)
            {
                throw new ArgumentNullException("messages");
            }

            this.commander = commander;
            this.messages = messages;

            this.AddCommandToAutorunFileCommand = new ReaderCommand(
                this.ExecuteAddCommandToAutorunFileCommand,
                ReaderCommandCanExecute.WhenConnectedAndIdle);

            this.DownloadAutorunFileCommand = new ReaderCommand(
                this.ExecuteDownloadAutorunFileCommand,
                 ReaderCommandCanExecute.WhenConnectedAndIdle);

            this.DeleteAutorunFileCommand = new ReaderCommand(
                this.ExecuteDeleteAutorunFileCommand,
                 ReaderCommandCanExecute.WhenConnectedAndIdle);
        }

        /// <summary>
        /// Gets or sets the command line to add to the Autorun file
        /// </summary>
        public string CommandLine
        {
            get
            {
                return this.commandLine;
            }

            set
            {
                if (this.commandLine != value)
                {
                    this.commandLine = value;
                    this.OnPropertyChanged("CommandLine");
                }
            }
        }

        /// <summary>
        /// Gets the command to add <see cref="Command"/> to the Autorun file
        /// </summary>
        public ICommand AddCommandToAutorunFileCommand { get; private set; }

        /// <summary>
        /// Gets the command to read the Autorun file and display it
        /// </summary>
        public ICommand DownloadAutorunFileCommand { get; private set; }

        /// <summary>
        /// Gets the command to delete the Autorun file from the device
        /// </summary>
        public ICommand DeleteAutorunFileCommand { get; private set; }

        /// <summary>
        /// Implementation of the command to add <see cref="Command"/> to the autorun file
        /// </summary>
        /// <param name="parameter">Not currently used</param>
        private void ExecuteAddCommandToAutorunFileCommand(object parameter)
        {
            try
            {
                WriteCommandToAutorunCommand command;
                IAsciiCommand newCommand;
                IEnumerable<string> validationErrors;

                validationErrors = CommandParser.TryParseCommandLine(out newCommand, this.CommandLine);

                if (validationErrors.Count() > 0)
                {                    
                    foreach (string error in validationErrors)
                    {
                        this.messages.IssueMessage(true, "Autorun", error);
                    }

                    throw new FormatException("Please enter a valid command line");
                }

                command = new WriteCommandToAutorunCommand();
                command.Command = this.CommandLine;

                this.commander.Execute(command, true);

                this.messages.IssueMessage(true, "Autorun", "Command added to autorun file");
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }

        /// <summary>
        /// Implementation of the command to read the autorun file
        /// </summary>
        /// <param name="parameter">Not currently used</param>
        private void ExecuteDownloadAutorunFileCommand(object parameter)
        {
            try
            {
                ReadAutorunFileCommand command;

                command = new ReadAutorunFileCommand();

                this.commander.Execute(command, true);

                this.messages.IssueMessage(true, "Autorun", " -- start of file --");

                using (System.IO.TextReader reader = new System.IO.StringReader(command.AutorunFile))
                {
                    string line;
                    while (!string.IsNullOrEmpty(line = reader.ReadLine()))
                    {
                        this.messages.IssueMessage(true, "Autorun", line);
                    }
                }

                this.messages.IssueMessage(true, "Autorun", " --  end of file  --");
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }

        /// <summary>
        /// Implementation of the command to delete the autorun file
        /// </summary>
        /// <param name="parameter">Not currently used</param>
        private void ExecuteDeleteAutorunFileCommand(object parameter)
        {
            try
            {
                // TODO: prompt confirm
                ReadAutorunFileCommand command;

                command = new ReadAutorunFileCommand();
                command.DeleteFile = Deletion.Yes;

                this.commander.Execute(command, true);
                this.messages.IssueMessage(true, "Autorun", "Autorun file deleted");
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }
    }
}

//-----------------------------------------------------------------------
// <copyright file="LogFileViewModel.cs" company="Technology Solutions UK Ltd"> 
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
    /// View model to manipulate the log file view model
    /// </summary>
    public class LogFileViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// Gets the name of this source for the <see cref="IMessageService"/>
        /// </summary>
        private const string SourceName = "LogFile";

        /// <summary>
        /// Backing field for IsLoggingEnabled
        /// </summary>
        private bool isCommandLoggingEnabled;

        /// <summary>
        /// To execute ASCII commands on the reader
        /// </summary>
        private ICommandService commander;

        /// <summary>
        /// To report messages to the user interface
        /// </summary>
        private IMessageService messages;

        /// <summary>
        /// Initializes a new instance of the LogFileViewModel class
        /// </summary>
        /// <param name="fileDownloadResponder">Reports the logfile as it is downloaded</param>
        /// <param name="commander">To execute ASCII commands</param>
        /// <param name="messages">To report to the user interface</param>
        public LogFileViewModel(FileDownloadResponder fileDownloadResponder, ICommandService commander, IMessageService messages)
        {
            if (fileDownloadResponder == null)
            {
                throw new ArgumentNullException("fileDownloadResponder");
            }

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

            this.DeleteLogCommand = new ReaderCommand(this.ExecuteDeleteLog, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.DisableLoggingCommand = new ReaderCommand(this.ExecuteDisableLogging, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.DownloadLogCommand = new ReaderCommand(this.ExecuteDownloadLog, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.EnableLoggingCommand = new ReaderCommand(this.ExecuteEnableLogging, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.ReadLoggingEnabledCommand = new ReaderCommand(this.ExecuteReadLoggingEnabled, ReaderCommandCanExecute.WhenConnectedAndIdle);

            // The file donwload responder is inserted at the top of the responder chain when the responder chain is setup
            // This is because downloading a log can generate a lot of messages so it is best to pull them from the chain
            // as soon as possible rather than visit a numbder of responders that will ignore the message.
            // It is registered as a service so that the service container will dispose the responder as the application 
            // closes which closes any open file left over
            // The responder captured the log file to a temporary file and raises the following results as the file is downloaded
            fileDownloadResponder.DownloadStarted += this.FileDownloadResponder_DownloadStarted;
            fileDownloadResponder.Downloading += this.FileDownloadResponder_Downloading;
            fileDownloadResponder.DownloadComplete += this.FileDownloadResponder_DownloadComplete;
        }

        /// <summary>
        /// Gets or sets a value indicating whether logging is enabled
        /// </summary>
        public bool IsCommandLoggingEnabled
        {
            get
            {
                return this.isCommandLoggingEnabled;
            }

            set
            {
                if (this.isCommandLoggingEnabled != value)
                {
                    this.isCommandLoggingEnabled = value;
                    this.OnPropertyChanged("IsCommandLoggingEnabled");
                }
            }
        }

        /// <summary>
        /// Gets the command that deletes the log from the device
        /// </summary>
        public ICommand DeleteLogCommand { get; private set; }

        /// <summary>
        /// Gets the command that disables logging on the device
        /// </summary>
        public ICommand DisableLoggingCommand { get; private set; }

        /// <summary>
        /// Gets the command that downloads the log from the device
        /// </summary>
        public ICommand DownloadLogCommand { get; private set; }

        /// <summary>
        /// Gets the command that enables logging on the device
        /// </summary>
        public ICommand EnableLoggingCommand { get; private set; }

        /// <summary>
        /// Gets the command that reads whether logging is enabled
        /// </summary>
        public ICommand ReadLoggingEnabledCommand { get; private set; }

        /// <summary>
        /// Executes the command tp delete the log file from the device
        /// </summary>
        /// <param name="parameter">Not currently used</param>
        private void ExecuteDeleteLog(object parameter)
        {
            // TODO: prompt confirm
            try
            {
                ReadLogFileCommand command;

                command = new ReadLogFileCommand();
                command.DeleteFile = Deletion.Yes;

                this.commander.Execute(command, true);
                this.messages.IssueMessage(true, SourceName, "Log file deleted");
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }

        /// <summary>
        /// Executes the command to disable logging on the device
        /// </summary>
        /// <param name="parameter">Not currently used</param>
        private void ExecuteDisableLogging(object parameter)
        {
            this.ExecuteLoggingEnabled(TriState.No);
        }

        /// <summary>
        /// Execute the command to download the log from the device
        /// </summary>
        /// <param name="parameter">Not currently used</param>
        private void ExecuteDownloadLog(object parameter)
        {
            try
            {
                ReadLogFileCommand command;

                command = new ReadLogFileCommand();
                command.MaxSynchronousWaitTime = 60; // TODO: wait for download to complete
                this.messages.IssueMessage(true, SourceName, "Downloading please wait...");
                this.commander.Execute(command, true);
                this.messages.IssueMessage(true, SourceName, "Log file downloaded");
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }

        /// <summary>
        /// Executes the command to enable logging for the device
        /// </summary>
        /// <param name="parameter">Not currently used</param>
        private void ExecuteEnableLogging(object parameter)
        {
            this.ExecuteLoggingEnabled(TriState.Yes);
        }

        /// <summary>
        /// Execute the command to determine whether command logging is enabled
        /// </summary>
        /// <param name="parameter">Not currently used</param>
        private void ExecuteReadLoggingEnabled(object parameter)
        {
            this.ExecuteLoggingEnabled(null);
        }

        /// <summary>
        /// Reads or sets command logging based on the IsCommandLoggingEnabled property.
        /// null = read, Yes = on, No = off
        /// </summary>
        /// <param name="commandLoggingEnabled">null = read value, Yes = enable, No = disable command logging</param>
        private void ExecuteLoggingEnabled(TriState? commandLoggingEnabled)
        {
            try
            {
                ReadLogFileCommand command;

                command = new ReadLogFileCommand();
                command.ReadParameters = true;
                command.TakeNoAction = true;
                command.IsCommandLoggingEnabled = commandLoggingEnabled;

                this.commander.Execute(command, true);

                this.IsCommandLoggingEnabled = command.IsCommandLoggingEnabled.Value == TriState.Yes;

                this.messages.IssueMessage(true, SourceName, "Logging enabled = " + this.IsCommandLoggingEnabled);
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }

        /// <summary>
        /// Raised from the <see cref="FileDownloadResponder"/> as it captures the start of a log file download.
        /// As a download can take some time notify the user the download has started
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void FileDownloadResponder_DownloadStarted(object sender, EventArgs e)
        {
            this.messages.IssueMessage(false, SourceName, "Downloading please wait...");
        }

        /// <summary>
        /// Raised from the <see cref="FileDownloadResponder"/> periodically as it captures the log file download.
        /// As a download can take some time notify the user the download is still going. Typically an event is 
        /// raised for every 100 lines downloaded
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void FileDownloadResponder_Downloading(object sender, EventArgs e)
        {
            string message;

            message = string.Format(
                System.Globalization.CultureInfo.CurrentUICulture,
                "Downloaded {0} lines",
                (sender as FileDownloadResponder).LineCount);

            this.messages.IssueMessage(false, SourceName, message);
        }

        /// <summary>
        /// Raised from the <see cref="FileDownloadResponder"/> as it captures the end of a log file download.
        /// Captures the name of the temporary file name. Moves the file to My Documents and shell opens the file
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">Data provided for the event</param>
        private void FileDownloadResponder_DownloadComplete(object sender, EventArgs e)
        {
            string message;
            string filename;

            filename = string.Format("Logfile {0:yyyyMMddTHHmmss ff}.txt", DateTime.Now);

            filename =
                System.IO.Path.Combine(
                System.Environment.GetFolderPath(Environment.SpecialFolder.Personal),
                filename);

            System.IO.File.Move((sender as FileDownloadResponder).FileName, filename);

            message = string.Format(
                System.Globalization.CultureInfo.CurrentUICulture,
                "File downloaded as {0}",
                filename);
            this.messages.IssueMessage(false, SourceName, message);

            System.Diagnostics.Process process = new System.Diagnostics.Process();
            process.EnableRaisingEvents = false;
            process.StartInfo.Verb = "open";
            process.StartInfo.FileName = filename;
            process.Start();
        }
    }
}

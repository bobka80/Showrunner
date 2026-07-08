//-----------------------------------------------------------------------
// <copyright file="SwitchViewModel.cs" company="Technology Solutions UK Ltd"> 
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
    using TechnologySolutions.Rfid.AsciiProtocol.Commands;

    /// <summary>
    /// View model for switch commands
    /// </summary>
    public class SwitchViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// Backing field for the SwitchPressTimeout
        /// </summary>
        private int switchPressTimeout = 10;

        /// <summary>
        /// To execute ASCII commands on the reader
        /// </summary>
        private ICommandService commander;

        /// <summary>
        /// To report messages to the user interface
        /// </summary>
        private IMessageService messages;

        /// <summary>
        /// Initializes a new instance of the SwitchViewModel class
        /// </summary>
        /// <param name="commander">To execute ASCII commands</param>
        /// <param name="messages">To report to the user interface</param>
        public SwitchViewModel(ICommandService commander, IMessageService messages)
            : base()
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

            this.SwitchDoublePressCommand = new ReaderCommand(this.ExecuteSwitchDoublePress, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.SwitchSinglePressCommand = new ReaderCommand(this.ExecuteSwitchSinglePress, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.ReadSwitchState = new ReaderCommand(this.ExecuteReadSwitchState, ReaderCommandCanExecute.WhenConnectedAndIdle);
        }

        /// <summary>
        /// Gets or sets the timeout in seconds that the single or double switch press should execute for
        /// </summary>
        public int SwitchPressTimeout
        {
            get
            {
                return this.switchPressTimeout;
            }

            set
            {
                if ((value < 0) || (value > 99))
                {
                    throw new ArgumentOutOfRangeException("value");
                }

                if (this.switchPressTimeout != value)
                {
                    this.switchPressTimeout = value;
                    this.OnPropertyChanged("SwitchPressTimeout");
                }
            }
        }

        /// <summary>
        /// Gets the command to read the current switch state
        /// </summary>
        public ICommand ReadSwitchState { get; private set; }

        /// <summary>
        /// Gets the ICommand instance that will perform a reader switch double press command
        /// </summary>
        public ICommand SwitchDoublePressCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand instance that will perform a reader switch single press command
        /// </summary>
        public ICommand SwitchSinglePressCommand { get; private set; }

        /// <summary>
        /// Command to obtain the current switch state
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteReadSwitchState(object parameter)
        {
            try
            {
                SwitchStateCommand command;

                command = new SwitchStateCommand();
                this.commander.Execute(command, true);
                this.messages.DisplayMessage(true, command.State);
            }
            catch (Exception ex)
            {
                this.messages.DisplayMessage(true, ex);
            }
        }

        /// <summary>
        /// Commands the reader to execute the Switch Double Press command
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteSwitchDoublePress(object parameter)
        {
            SwitchDoublePressCommand command;

            command = new SwitchDoublePressCommand();
            command.PressDuration = this.SwitchPressTimeout;
            command.MaxSynchronousWaitTime = command.PressDuration.Value + 2;
            this.commander.Execute(command, true);
        }

        /// <summary>
        /// Commands the reader to execute the Switch Single Press command
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteSwitchSinglePress(object parameter)
        {
            SwitchSinglePressCommand command;

            command = new SwitchSinglePressCommand();
            command.PressDuration = this.SwitchPressTimeout;
            command.MaxSynchronousWaitTime = command.PressDuration.Value + 2;
            this.commander.Execute(command, true);
        }
    }
}


//-----------------------------------------------------------------------
// <copyright file="CommandsViewModel.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocol.Sample.ViewModels
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using Services;

    /// <summary>
    /// View model for reader commands
    /// </summary>
    public class CommandsViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// Backing field for the SwitchPressTimeout
        /// </summary>
        private int switchPressTimeout = 10;

        /// <summary>
        /// Initializes a new instance of the CommandsViewModel class
        /// </summary>
        public CommandsViewModel()
            : base()
        {
            this.AbortCommand = new ReaderCommand(this.ExecuteAbort, ReaderCommandCanExecute.WhenConnected);
            this.FactoryDefaultsCommand = new ReaderCommand(this.ExecuteFactoryDefaults, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.SwitchDoublePressCommand = new ReaderCommand(this.ExecuteSwitchDoublePress, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.SwitchSinglePressCommand = new ReaderCommand(this.ExecuteSwitchSinglePress, ReaderCommandCanExecute.WhenConnectedAndIdle);
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
        /// Gets the ICommand instance that will perform a reader abort command
        /// </summary>
        public ICommand AbortCommand { get; private set; }
        
        /// <summary>
        /// Gets the ICommand instance that will perform a reader factory defaults command
        /// </summary>
        public ICommand FactoryDefaultsCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand instance that will perform a reader switch double press command
        /// </summary>
        public ICommand SwitchDoublePressCommand { get; private set; }

        /// <summary>
        /// Gets the ICommand instance that will perform a reader switch single press command
        /// </summary>
        public ICommand SwitchSinglePressCommand { get; private set; }

        /// <summary>
        /// Commands the reader to execute the Abort command
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteAbort(object parameter)
        {
            TechnologySolutions.Rfid.AsciiProtocol.Commands.AbortCommand abort;

            abort = new TechnologySolutions.Rfid.AsciiProtocol.Commands.AbortCommand();
            Service.Reader.ExecuteCommand(abort, null);
        }

        /// <summary>
        /// Commands the reader to execute the Factory Defaults command
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteFactoryDefaults(object parameter)
        {
            TechnologySolutions.Rfid.AsciiProtocol.Commands.FactoryDefaultsCommand factoryDefaults;

            factoryDefaults = new TechnologySolutions.Rfid.AsciiProtocol.Commands.FactoryDefaultsCommand();
            Service.Reader.ExecuteCommand(factoryDefaults, factoryDefaults.Responder);
        }

        /// <summary>
        /// Commands the reader to execute the Switch Double Press command
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteSwitchDoublePress(object parameter)
        {
            TechnologySolutions.Rfid.AsciiProtocol.Commands.SwitchDoublePressCommand command;

            command = new TechnologySolutions.Rfid.AsciiProtocol.Commands.SwitchDoublePressCommand();
            command.PressDuration = this.SwitchPressTimeout;
            command.MaxSynchronousWaitTime = command.PressDuration.Value + 2;
            Service.Reader.ExecuteCommand(command, command.Responder);
        }

        /// <summary>
        /// Commands the reader to execute the Switch Single Press command
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteSwitchSinglePress(object parameter)
        {
            TechnologySolutions.Rfid.AsciiProtocol.Commands.SwitchSinglePressCommand command;

            command = new TechnologySolutions.Rfid.AsciiProtocol.Commands.SwitchSinglePressCommand();
            command.PressDuration = this.SwitchPressTimeout;
            command.MaxSynchronousWaitTime = command.PressDuration.Value + 2;
            Service.Reader.ExecuteCommand(command, command.Responder);
        }
    }
}

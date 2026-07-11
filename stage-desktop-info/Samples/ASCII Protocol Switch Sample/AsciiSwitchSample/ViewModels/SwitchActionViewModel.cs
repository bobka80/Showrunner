//-----------------------------------------------------------------------
// <copyright file="SwitchActionViewModel.cs" company="Technology Solutions UK Ltd"> 
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
    using TechnologySolutions.Rfid.AsciiProtocol;
    using TechnologySolutions.Rfid.AsciiProtocol.Commands;

    /// <summary>
    /// ViewModel to command the SwitchAction
    /// </summary>
    public class SwitchActionViewModel
        : PropertyChangedViewModel
    {
        /// <summary>
        /// Backing field for <see cref="IsAsynchronousReportingEnabled"/>
        /// </summary>
        private bool isAsynchronousReportingEnabled;

        /// <summary>
        /// Backing field for <see cref="DoublePressAction"/>
        /// </summary>
        private SwitchAction doublePressAction;

        /// <summary>
        /// Backing fied for <see cref="SinglePressAction"/>
        /// </summary>
        private SwitchAction singlePressAction;

        /// <summary>
        /// Backing field for <see cref="DoublePressUserAction"/>
        /// </summary>
        private string doublePressUserAction;

        /// <summary>
        /// Backing field for <see cref="SinglePressUserAction"/>
        /// </summary>
        private string singlePressUserAction;

        /// <summary>
        /// Initializes a new instance of the SwitchActionViewModel class
        /// </summary>
        public SwitchActionViewModel()
            : base()
        {
            this.ApplySwitchActionCommand = new ReaderCommand(this.ExecuteApplySwitchAction, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.ReadSwitchActionCommand = new ReaderCommand(this.ExecuteReadSwitchAction, ReaderCommandCanExecute.WhenConnectedAndIdle);

            this.ApplyDoublePressUserAction = new ReaderCommand(this.ExecuteApplyDoublePressUserAction, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.ReadDoublePressUserAction = new ReaderCommand(this.ExecuteReadDoublePressUserAction, ReaderCommandCanExecute.WhenConnectedAndIdle);

            this.ApplySinglePressUserAction = new ReaderCommand(this.ExecuteApplySinglePressUserAction, ReaderCommandCanExecute.WhenConnectedAndIdle);
            this.ReadSinglePressUserAction = new ReaderCommand(this.ExecuteReadSinglePressUserAction, ReaderCommandCanExecute.WhenConnectedAndIdle);
        }

        /// <summary>
        /// Gets the command to update the reader with the new switch action values
        /// </summary>
        public ICommand ApplySwitchActionCommand { get; private set; }

        /// <summary>
        /// Gets the command to read the current switch action values from the reader
        /// </summary>
        public ICommand ReadSwitchActionCommand { get; private set; }

        /// <summary>
        /// Gets the command to update the user action for double press
        /// </summary>
        public ICommand ApplyDoublePressUserAction { get; private set; }

        /// <summary>
        /// Gets the command to read the user action for double press
        /// </summary>
        public ICommand ReadDoublePressUserAction { get; private set; }

        /// <summary>
        /// Gets the command to update the user action for single press
        /// </summary>
        public ICommand ApplySinglePressUserAction { get; private set; }

        /// <summary>
        /// Gets the command to read the user action for single press
        /// </summary>
        public ICommand ReadSinglePressUserAction { get; private set; }
      
        /// <summary>
        /// Gets or sets a value indicating the action the reader should perform for a double switch press
        /// </summary>
        public SwitchAction DoublePressAction
        {
            get
            {
                return this.doublePressAction;
            }

            set
            {
                if (this.doublePressAction != value)
                {
                    this.doublePressAction = value;
                    this.OnPropertyChanged("DoublePressAction");
                }
            }
        }

        /// <summary>
        /// Gets or sets a value that is a command line that is executed when a double press is executed on the reader
        /// and the double press action is set to user
        /// </summary>
        public string DoublePressUserAction
        {
            get
            {
                return this.doublePressUserAction;
            }

            set
            {
                if (this.doublePressUserAction != value)
                {
                    this.doublePressUserAction = value;
                    this.OnPropertyChanged("DoublePressUserAction");
                }
            }
        }

        /// <summary>
        /// Gets or sets a value indicating whether the switch should report changes in state as asynchronous messages
        /// </summary>
        public bool IsAsynchronousReportingEnabled
        {
            get
            {
                return this.isAsynchronousReportingEnabled;
            }

            set
            {
                if (this.isAsynchronousReportingEnabled != value)
                {
                    this.isAsynchronousReportingEnabled = value;
                    this.OnPropertyChanged("IsAsynchronousReportingEnabled");
                }
            }
        }

        /// <summary>
        /// Gets or sets a value indicating the action the reader should perform for a single switch press
        /// </summary>
        public SwitchAction SinglePressAction
        {
            get
            {
                return this.singlePressAction;
            }

            set
            {
                if (this.singlePressAction != value)
                {
                    this.singlePressAction = value;
                    this.OnPropertyChanged("SinglePressAction");
                }
            }
        }

        /// <summary>
        /// Gets or sets a value that is a command line that is executed when a single press is executed on the reader
        /// and the single press action is set to user
        /// </summary>
        public string SinglePressUserAction
        {
            get
            {
                return this.singlePressUserAction;
            }

            set
            {
                if (this.singlePressUserAction != value)
                {
                    this.singlePressUserAction = value;
                    this.OnPropertyChanged("SinglePressUserAction");
                }
            }
        }

        /// <summary>
        /// Implementation of the apply switch action command. Set the switch action values in the reader
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteApplySwitchAction(object parameter)
        {
            SwitchActionCommand command;

            command = new SwitchActionCommand();
            command.AsynchronousReportingEnabled = this.IsAsynchronousReportingEnabled ? TriState.Yes : TriState.No;
            command.DoublePressAction = this.DoublePressAction;
            command.SinglePressAction = this.SinglePressAction;

            Service.Reader.ExecuteCommand(command, command.Responder);
        }

        /// <summary>
        /// Implementation of the read switch action command. Read the switch action values from the reader
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteReadSwitchAction(object parameter)
        {
            SwitchActionCommand command;

            command = new SwitchActionCommand();
            command.ReadParameters = true;

            Service.Reader.ExecuteCommand(command, command.Responder);

            this.IsAsynchronousReportingEnabled = command.AsynchronousReportingEnabled.Value == TriState.Yes;
            this.DoublePressAction = command.DoublePressAction.Value;
            this.SinglePressAction = command.SinglePressAction.Value;
        }

        /// <summary>
        /// Implementation of <see cref="ApplyDoublePressUserAction"/>
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteApplyDoublePressUserAction(object parameter)
        {
            SwitchDoublePressUserActionCommand command;

            command = new SwitchDoublePressUserActionCommand();
            command.DoublePressUserAction = this.DoublePressUserAction;
            Service.Reader.ExecuteCommand(command, command.Responder);
        }

        /// <summary>
        /// Implementation of <see cref="ReadDoublePressUserAction"/>
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteReadDoublePressUserAction(object parameter)
        {
            SwitchDoublePressUserActionCommand command;

            command = new SwitchDoublePressUserActionCommand();            
            Service.Reader.ExecuteCommand(command, command.Responder);
            this.DoublePressUserAction = command.DoublePressUserAction;
        }

        /// <summary>
        /// Implementation of <see cref="ApplySinglePressUserAction"/>
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteApplySinglePressUserAction(object parameter)
        {
            SwitchSinglePressUserActionCommand command;

            command = new SwitchSinglePressUserActionCommand();
            command.SinglePressUserAction = this.SinglePressUserAction;
            Service.Reader.ExecuteCommand(command, command.Responder);
        }

        /// <summary>
        /// Implementation of <see cref="ReadSinglePressUserAction"/>
        /// </summary>
        /// <param name="parameter">Parameter not used</param>
        private void ExecuteReadSinglePressUserAction(object parameter)
        {
            SwitchSinglePressUserActionCommand command;

            command = new SwitchSinglePressUserActionCommand();            
            Service.Reader.ExecuteCommand(command, command.Responder);
            this.SinglePressUserAction = command.SinglePressUserAction;
        }
    }
}

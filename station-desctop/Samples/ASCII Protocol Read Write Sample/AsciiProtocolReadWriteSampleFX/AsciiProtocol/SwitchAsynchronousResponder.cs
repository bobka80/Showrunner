//-----------------------------------------------------------------------
// <copyright file="SwitchAsynchronousResponder.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.Rfid.AsciiProtocol
{
    using System;    
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Linq;
    using System.Text;    

    /// <summary>
    /// Implements a responder that can capture the Asynchronous changes in switch state that are reported when the switch action
    /// command is used to enable asynchrnous notification of changes in switch state
    /// </summary>
    public class SwitchAsynchronousResponder
        : IAsciiCommandResponder, INotifyPropertyChanged
    {
        /// <summary>
        /// Determines whether the notification is part of a command querying the switch state or an asynchronous notification
        /// </summary>
        private bool inSwitchCommand;

        /// <summary>
        /// cache of the previous state of the switch used to determine changes in state
        /// </summary>
        private SwitchState currentState;

        /// <summary>
        /// Raised whent the <see cref="State"/> of the switch changes
        /// </summary>
        public event EventHandler<SwitchStateEventArgs> SwitchStateChanged;

        /// <summary>
        /// Raised when the <see cref="State"/> property changes
        /// </summary>
        public event PropertyChangedEventHandler PropertyChanged;

        /// <summary>
        /// Gets or sets the current state of the switch
        /// </summary>
        public SwitchState State
        {
            get
            {
                return this.currentState;
            }

            set
            {
                if (this.currentState != value)
                {
                    this.currentState = value;
                    this.OnPropertyChanged("CurrentState");
                    this.OnSwitchStateChanged(value);
                }
            }
        }

        /// <summary>
        /// Called when a ASCII response line is received from the reader. Processes the line
        /// </summary>
        /// <param name="line">The line to process</param>
        /// <param name="moreLinesAvailable">True if more lines are to cached to follow</param>
        /// <returns>True if this method has processed the line and no further responders should receive it</returns>
        public bool ProcessReceivedLine(IAsciiResponseLine line, bool moreLinesAvailable)
        {
            if (line.IsCommandStarted() && line.Value.StartsWith(".ss", StringComparison.OrdinalIgnoreCase))
            {
                this.inSwitchCommand = true;
            }
            else if (line.IsError() || line.IsOk())
            {
                this.inSwitchCommand = false;
            }
            else if (line.HasHeader("SW") && !this.inSwitchCommand)
            {
                // Asynchrnous switch state changes are not preceded by "CS" and followed by "OK"
                // if we see a "CS: .SS" "SW: xxx" "OK:" then we have seen a switch state command be issued to the reader and
                // the responder for that command should consume the switch state
                this.State = line.Value.ParseParameterAs<SwitchState>();
                return true;
            }

            return false;
        }        

        /// <summary>
        /// Raises the <see cref="PropertyChanged"/> event
        /// </summary>
        /// <param name="propertyName">The name of the property with a value that has changed</param>
        protected virtual void OnPropertyChanged(string propertyName)
        {
            PropertyChangedEventHandler handler;

            handler = this.PropertyChanged;
            if (handler != null)
            {
                handler(this, new PropertyChangedEventArgs(propertyName));
            }
        }

        /// <summary>
        /// Raises the <see cref="SwitchStateChanged"/> event
        /// </summary>
        /// <param name="state">The new state of the switch</param>
        protected virtual void OnSwitchStateChanged(SwitchState state)
        {
            EventHandler<SwitchStateEventArgs> handler;

            handler = this.SwitchStateChanged;
            if (handler != null)
            {
                handler(this, new SwitchStateEventArgs(state));
            }
        }
    }
}

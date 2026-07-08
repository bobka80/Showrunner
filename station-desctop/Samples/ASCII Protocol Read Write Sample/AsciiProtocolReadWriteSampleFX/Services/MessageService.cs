//-----------------------------------------------------------------------
// <copyright file="MessageService.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Services
{
    using System;
    using System.Collections.Generic;    
    using System.Linq;
    using System.Text;

    using TechnologySolutions.ModelViewViewModel;
    using TechnologySolutions.Rfid.AsciiProtocol;

    /// <summary>
    /// Service that provides a centralized route to send messages to the responses and messages windows
    /// </summary>
    public class MessageService 
        : IMessageService
    {
        /// <summary>
        /// Raised to indicate messages to the user interface
        /// </summary>
        public event EventHandler<TextEventArgs> Message;        

        /// <summary>
        /// Display message(s) about a barcode event
        /// </summary>
        /// <param name="synchronous">True if the message was generated synchronously</param>
        /// <param name="e">The value to display</param>
        public void DisplayMessage(bool synchronous, BarcodeEventArgs e)
        {
            this.IssueMessage(synchronous, "Barcode", e.Barcode);
        }

        /// <summary>
        /// Display message(s) about an exception
        /// </summary>
        /// <param name="synchronous">True if the message was generated synchronously</param>
        /// <param name="ex">The value to display</param>
        public void DisplayMessage(bool synchronous, Exception ex)
        {
            this.IssueMessage(synchronous, "ERROR", ex.Message);
        }

        /// <summary>
        /// Display message(s) about a switch state
        /// </summary>
        /// <param name="synchronous">True if the message was generated synchronously</param>
        /// <param name="state">The value to display</param>
        public void DisplayMessage(bool synchronous, SwitchState state)
        {
            this.IssueMessage(synchronous, "Switch", state);
        }

        /// <summary>
        /// Display message(s) about a transponder event
        /// </summary>
        /// <param name="synchronous">True if the message was generated synchronously</param>
        /// <param name="transponder">The value to display</param>
        public void DisplayMessage(bool synchronous, TransponderData transponder)
        {
            this.IssueMessage(synchronous, "Transponder", transponder.ToString());
        }

        /// <summary>
        /// Displays the message to the user interface through an event
        /// </summary>
        /// <param name="synchronous">True if the source was synchronous, false if it was asynchronous</param>
        /// <param name="source">The type of event e.g. "Barcode, "Switch", "Transponder"</param>
        /// <param name="message">The message to display</param>
        /// TODO: this should be a databound observable list?
        public void IssueMessage(bool synchronous, string source, object message)
        {
            string text;

            text = string.Format(
                System.Globalization.CultureInfo.CurrentUICulture,
                "{0,-8} {1:-15} {2}",
                synchronous ? "[ Sync]" : "[Async]",
                source,
                message);

            this.OnMessage(text);
        }

        /// <summary>
        /// Raises the <see cref="Message"/> event
        /// </summary>
        /// <param name="value">The message to display</param>
        protected virtual void OnMessage(string value)
        {
            EventHandler<TextEventArgs> handler;

            handler = this.Message;
            if (handler != null)
            {
                handler(this, new TextEventArgs(value));
            }
        }      
    }
}

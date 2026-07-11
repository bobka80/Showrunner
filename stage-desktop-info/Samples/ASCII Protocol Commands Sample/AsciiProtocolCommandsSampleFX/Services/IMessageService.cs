//-----------------------------------------------------------------------
// <copyright file="IMessageService.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Services
{
    using System;
    using TechnologySolutions.Rfid.AsciiProtocol;

    /// <summary>
    /// Provides methods to report messages to the user interface
    /// </summary>
    public interface IMessageService
    {
        /// <summary>
        /// Display message(s) about an exception
        /// </summary>
        /// <param name="synchronous">True if the message was generated synchronously</param>
        /// <param name="ex">The value to display</param>
        void DisplayMessage(bool synchronous, Exception ex);

        /// <summary>
        /// Display message(s) about a switch state
        /// </summary>
        /// <param name="synchronous">True if the message was generated synchronously</param>
        /// <param name="state">The value to display</param>
        void DisplayMessage(bool synchronous, SwitchState state);

        /// <summary>
        /// Display message(s) about a barcode event
        /// </summary>
        /// <param name="synchronous">True if the message was generated synchronously</param>
        /// <param name="e">The value to display</param>
        void DisplayMessage(bool synchronous, BarcodeEventArgs e);

        /// <summary>
        /// Display message(s) about a transponder event
        /// </summary>
        /// <param name="synchronous">True if the message was generated synchronously</param>
        /// <param name="transponder">The value to display</param>
        void DisplayMessage(bool synchronous, TransponderData transponder);

        /// <summary>
        /// Displays the message to the user interface through an event
        /// </summary>
        /// <param name="synchronous">True if the source was synchronous, false if it was asynchronous</param>
        /// <param name="source">The type of event e.g. "Barcode, "Switch", "Transponder"</param>
        /// <param name="message">The message to display</param>
        /// TODO: this should be a databound observable list?
        void IssueMessage(bool synchronous, string source, object message);
    }
}

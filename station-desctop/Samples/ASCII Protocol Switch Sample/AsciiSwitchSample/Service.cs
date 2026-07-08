//-----------------------------------------------------------------------
// <copyright file="Service.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocol.Sample
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using Services;
    using TechnologySolutions.Rfid.AsciiProtocol;

    /// <summary>
    /// Provides access to application services
    /// </summary>
    public class Service
    {
        /// <summary>
        /// Gets or sets a responder that copies messages to the display
        /// </summary>
        public static DisplayResponder DisplayResponder { get; set; }

        /// <summary>
        /// Gets or sets the reader service
        /// </summary>
        public static ReaderService Reader { get; set; }

        /// <summary>
        /// Gets the application settings
        /// </summary>
        internal static Properties.Settings Settings
        {
            get
            {
                return Properties.Settings.Default;
            }
        }

        /// <summary>
        /// Sets up the application services
        /// </summary>
        public static void StartUp()
        {
            DisplayResponder = new DisplayResponder();
            Reader = new ReaderService();
        }

        /// <summary>
        /// Shuts down the application services
        /// </summary>
        public static void ShutDown()
        {
            Dispose(Reader);
            Dispose(DisplayResponder);
        }

        /// <summary>
        /// Disposes a service if the service implements <see cref="IDisposable"/>
        /// </summary>
        /// <param name="service">The service to dispose</param>
        /// <returns>True if the service was disposed</returns>
        public static bool Dispose(object service)
        {
            IDisposable disposable;

            disposable = service as IDisposable;
            if (disposable != null)
            {
                disposable.Dispose();
                return true;
            }

            return false;
        }
    }
}

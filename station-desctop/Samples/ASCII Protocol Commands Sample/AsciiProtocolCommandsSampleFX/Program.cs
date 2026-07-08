//-----------------------------------------------------------------------
// <copyright file="Program.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Windows.Forms;

    using log4net;

    /// <summary>
    /// Provides the entry point for the application
    /// </summary>
    public static class Program
    {
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        [STAThread]
        public static void Main()
        {
            ILog log;

            log4net.Config.XmlConfigurator.Configure();
            log = LogManager.GetLogger(typeof(Program));
            log.Info("--- Application Start ---");

            // service container last as long as the application. Provides services via the Service static class
            using (System.ComponentModel.Design.ServiceContainer container = new System.ComponentModel.Design.ServiceContainer())
            {
                Form mainForm;

                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);

                Service.RegisterServices(container);

                mainForm = new Views.MainForm();
                Service.RegisterMainView(mainForm);                
                Application.Run(mainForm);

                log.Info("Saving application settings");
                Properties.Settings.Default.Save();
            }

            log.Info("--- Application End ---");

            LogManager.Shutdown();
        }
    }
}


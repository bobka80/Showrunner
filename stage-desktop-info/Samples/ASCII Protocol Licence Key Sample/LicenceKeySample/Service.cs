//-----------------------------------------------------------------------
// <copyright file="Service.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.Design;
    using System.Linq;
    using System.Text;

    using Entities;
    using Services;
    using TechnologySolutions.ModelViewViewModel;    
    using TechnologySolutions.ModelViewViewModel.Services;
    using TechnologySolutions.Rfid.AsciiProtocol.Commands;
    using ViewModels;

    /// <summary>
    /// Provides access to application services
    /// </summary>
    public static class Service
    {
        /// <summary>
        /// Registers the main view of the application as the control to use to invoke actions to the UI thread
        /// </summary>
        /// <param name="mainForm">The main form of the application</param>
        public static void RegisterMainView(System.Windows.Forms.Form mainForm)
        {
            (ServiceProvider.Current.Get<IDispatcher>() as ControlDispatcher).Control = mainForm;
        }

        /// <summary>
        /// Registers the application services with the container
        /// </summary>
        /// <param name="container">The container to register the services with</param>
        public static void RegisterServices(IServiceContainer container)
        {
            container.AddService(typeof(IDispatcher), new ControlDispatcher());

            // add these commands to be used as asynchronous responders in the AsciiCommander's responder chain
            container.AddService(typeof(BarcodeCommand), new BarcodeCommand());
            container.AddService(typeof(InventoryCommand), new InventoryCommand());

            // create the reader service passing in the asynchronous responders
            container.AddService(
                typeof(ReaderService), 
                new ReaderService(container.Get<BarcodeCommand>(), container.Get<InventoryCommand>()));
            container.AddService(typeof(IReaderCommand), container.Get<ReaderService>());
            container.AddService(typeof(IReaderConnect), container.Get<ReaderService>());

            // add the settings
            container.AddService(typeof(ISettings), Properties.Settings.Default);

            // create the view models required by ViewModelLocator.ViewModel
            container.AddService(typeof(MainViewModel), CreatorCallback);
            container.AddService(typeof(ConnectViewModel), CreatorCallback);
            container.AddService(typeof(SettingsViewModel), CreatorCallback);            
        }

        /// <summary>
        /// Creates an instance of the requested service
        /// </summary>
        /// <param name="provider">A service provider to reference when creating services</param>
        /// <param name="requestedType">The type of the requested service</param>
        /// <returns>The service instance</returns>
        /// <exception cref="ArgumentException">If the requestedType cannot be created</exception>
        private static object CreatorCallback(IServiceProvider provider, Type requestedType)
        {
            if (typeof(MainViewModel).Equals(requestedType))
            {
                return new MainViewModel(
                    provider.Get<IReaderCommand>(),
                    provider.Get<ISettings>(),
                    provider.Get<BarcodeCommand>(),
                    provider.Get<InventoryCommand>());
            }
            else if (typeof(ConnectViewModel).Equals(requestedType))
            {
                return new ConnectViewModel(provider.Get<IReaderConnect>());
            }
            else if (typeof(SettingsViewModel).Equals(requestedType))
            {
                return new SettingsViewModel(provider.Get<ISettings>());
            }            
            else
            {
                throw new ArgumentException("don't know how to create an instance of " + requestedType.FullName);
            }
        }
    }
}
